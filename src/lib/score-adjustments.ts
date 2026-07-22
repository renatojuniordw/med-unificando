// Sistema de ajuste de scores baseado em feedback dos usuários
// Coleta dados de feedback e gera ajustes para melhorar a relevância

import { prisma } from '@/lib/prisma'

interface ScoreAdjustment {
  query: string
  medicineId: number
  boost: number // -0.3 a +0.3: quanto ajustar o score
  confidence: number // 0 a 1: quão confiável é o ajuste
}

// Cache de ajustes em memória (atualizado a cada consulta)
let adjustmentsCache: ScoreAdjustment[] | null = null
let lastAdjustmentUpdate: number = 0
const ADJUSTMENT_TTL = 5 * 60 * 1000 // 5 minutos

// Mapa de sinônimos problemáticos que geram falsos positivos
// Adicionado manualmente com base em análises de feedback
const MANUAL_ADJUSTMENTS: ScoreAdjustment[] = [
  // Anti-inflamatórios clássicos que merecem boost para "articulação"
  { query: 'articulação', medicineId: 0, boost: 0.15, confidence: 0.8 },
]

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim()
}

// Buscar ajustes do banco de dados baseados em feedback
async function loadAdjustmentsFromDb(): Promise<ScoreAdjustment[]> {
  const now = Date.now()
  
  // Usar cache se ainda válido
  if (adjustmentsCache && (now - lastAdjustmentUpdate) < ADJUSTMENT_TTL) {
    return adjustmentsCache
  }
  
  // Buscar feedbacks do banco
  const feedbacks = await prisma.searchFeedback.findMany({
    select: {
      query: true,
      medicineId: true,
      medicineName: true,
      feedback: true,
    },
  })
  
  // Agrupar por query + medicineId
  const groupMap = new Map<string, { helpful: number; notHelpful: number }>()
  
  for (const f of feedbacks) {
    const key = `${normalizeQuery(f.query)}:${f.medicineId}`
    const entry = groupMap.get(key) || { helpful: 0, notHelpful: 0 }
    if (f.feedback === 'helpful') entry.helpful++
    else entry.notHelpful++
    groupMap.set(key, entry)
  }
  
  const adjustments: ScoreAdjustment[] = []
  
  for (const [key, data] of groupMap.entries()) {
    const [query, medicineIdStr] = key.split(':')
    const medicineId = parseInt(medicineIdStr)
    const total = data.helpful + data.notHelpful
    
    // Só gerar ajuste se tiver pelo menos 3 feedbacks
    if (total < 3) continue
    
    const approvalRate = data.helpful / total
    const confidence = Math.min(total / 10, 1) // Mais feedbacks = mais confiança
    
    let boost = 0
    
    if (approvalRate >= 0.8) {
      // Alta aprovação: aumentar score
      boost = 0.1 + (approvalRate - 0.8) * 0.5
    } else if (approvalRate <= 0.3) {
      // Baixa aprovação: reduzir score
      boost = -0.1 - (0.3 - approvalRate) * 0.5
    }
    
    if (boost !== 0) {
      adjustments.push({
        query,
        medicineId,
        boost: Math.max(-0.3, Math.min(0.3, boost)),
        confidence,
      })
    }
  }
  
  // Combinar com ajustes manuais
  adjustments.push(...MANUAL_ADJUSTMENTS)
  
  // Atualizar cache
  adjustmentsCache = adjustments
  lastAdjustmentUpdate = now
  
  return adjustments
}

// Aplicar ajustes a um resultado de busca
export async function applyScoreAdjustments<T extends { 
  id: number; 
  therapeuticClass?: string | null;
  indications?: string | null;
  activeIngredient?: string | null;
}>(
  query: string,
  results: { score: number; medicine: T }[]
): Promise<{ score: number; medicine: T }[]> {
  if (results.length === 0) return results
  
  const adjustments = await loadAdjustmentsFromDb()
  const normalizedQuery = normalizeQuery(query)

  return results.map(r => {
    let totalBoost = 0
    const medicineTherapeuticClass = r.medicine.therapeuticClass?.toLowerCase() || ''
    const medicineIndications = r.medicine.indications?.toLowerCase() || ''
    const medicineIngredient = r.medicine.activeIngredient?.toLowerCase() || ''
    const combinedProfile = [
      medicineTherapeuticClass,
      medicineIndications,
      medicineIngredient,
    ].join(' ')
    
    for (const adj of adjustments) {
      // Verificar se o ajuste se aplica (query normalizada contém a palavra-chave OU vice-versa)
      const queryMatch = normalizedQuery.includes(adj.query) || adj.query.includes(normalizedQuery)
      const exactMatch = adj.query === normalizedQuery
      
      if (!queryMatch && !exactMatch) continue
      
      // Se o ajuste é para um medicineId específico
      if (adj.medicineId > 0 && adj.medicineId === r.medicine.id) {
        totalBoost += adj.boost * adj.confidence
        continue
      }
      
      // Se o ajuste é para todos os medicamentos (medicineId = 0), aplicar baseado na classe
      if (adj.medicineId === 0) {
        // Aplicar boost/penalty baseado na análise
        totalBoost += adj.boost * adj.confidence * 0.5
      }
    }
    
    // Aplicar penalidade para medicamentos tópicos em buscas de "dor de cabeça"
    if (normalizedQuery.includes('dor de cabeça') || normalizedQuery.includes('cefaleia')) {
      const topicalSignals = ['topico', 'topica', 'top.', 'creme', 'pomada', 'gel', 'adesivo', 'uso topico', 'uso tópico']
      const isTopical = topicalSignals.some(signal => combinedProfile.includes(signal))
      if (isTopical) {
        totalBoost -= 0.3
      }
    }
    
    // --- Penalidades para "remédio para estômago" ---
    if (normalizedQuery.includes('estomago') || normalizedQuery.includes('estômago') || 
        normalizedQuery.includes('gastrico') || normalizedQuery.includes('gástrico') ||
        normalizedQuery.includes('azia') || normalizedQuery.includes('refluxo')) {
      
      // Classes que NÃO são de estômago/sistema digestivo
      const nonGastricSignals = [
        'oftalmologico', 'oftalmico', 'ocular', 'colirio', 'colírio', 'glaucoma', 'pressao intraocular', 'pressão intraocular',
        'osseo', 'osso', 'bifosfonato', 'osteoporose', 'calcio', 'cálcio', 'densidade ossea', 'densidade óssea',
        'ginecologico', 'ginecologia',
        'dermatologico', 'pele',
        'oncologico', 'antineoplasico', 'quimioterapia',
        'cardiovascular', 'cardiaco', 'cardíaco',
        'respiratorio', 'pulmao', 'pulmão', 'broncodilatador',
        'neurologico', 'neurológico',
        'psiquiatrico', 'psiquiátrico',
        'urologico', 'urológico', 'urinario', 'urinário',
        'antibiotico', 'antibiótico', 'antimicrobiano',
        'vacina', 'imunizacao', 'imunização',
        'motilidade intestinal', 'intestino irritavel', 'intestino irritável', 'constipacao', 'constipação',
      ]
      
      const isNonGastric = nonGastricSignals.some(signal => combinedProfile.includes(signal))
      if (isNonGastric) {
        totalBoost -= 0.45
      }
      
      // Penalidade extra para colírios que começam com "Stom" (engana o embedding)
      if (medicineTherapeuticClass.includes('oftalmico') || medicineTherapeuticClass.includes('oftalmologico') || medicineTherapeuticClass.includes('colirio')) {
        totalBoost -= 0.6
      }
    }
    
    // --- Penalidade geral para nomes que enganam o embedding ---
    // Ex: Stomup parece "estômago" mas é colírio
    // Este é um mecanismo de segurança para medicamentos cujo nome comercial
    // soa como uma condição mas são de área completamente diferente
    const deceptiveNamePatterns = [
      { nome: 'stom', classe: 'oftalmico', penalty: 0.4 },  // Stomup = colírio
    ]
    
    for (const pattern of deceptiveNamePatterns) {
      if (combinedProfile.includes(pattern.classe)) {
        totalBoost -= pattern.penalty
      }
    }
    
    const adjustedScore = Math.max(0, Math.min(1, r.score + totalBoost))
    
    return {
      ...r,
      score: adjustedScore,
    }
  })
  // Reordenar com base no score ajustado (penalidades podem mudar a ordem)
  .sort((a, b) => b.score - a.score)
  // Remover resultados com score irrelevante (falsos positivos severos)
  // O threshold de 0.15 era muito agressivo: resultados puramente keyword
  // (sem support semântico) têm scores típicos de 10-14%, sendo cortados.
  // Reduzido para 0.08 para preservar resultados keyword relevantes.
  .filter(r => r.score > 0.08)
}

// Função para limpar cache (útil para testes)
export function clearAdjustmentsCache(): void {
  adjustmentsCache = null
  lastAdjustmentUpdate = 0
}

// Função para forçar recarga dos ajustes
export async function reloadAdjustments(): Promise<number> {
  clearAdjustmentsCache()
  const adjustments = await loadAdjustmentsFromDb()
  return adjustments.length
}