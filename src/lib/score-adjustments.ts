// Sistema de ajuste de scores baseado em feedback dos usuários
// Coleta dados de feedback e gera ajustes para melhorar a relevância.
// Ajustes derivados de feedback são clampados em ±0.3; regras de tópico
// (dor de cabeça/estômago) podem adicionar penalidades além desse limite.

import { prisma } from '@/lib/prisma'
import { normalizeQuery } from '@/lib/text-utils'
import { SEARCH } from '@/lib/config'

interface ScoreAdjustment {
  query: string
  medicineId: number
  boost: number // ajuste derivado de feedback, clamp em ±0.3
  confidence: number // 0 a 1: quão confiável é o ajuste
}

// Cache de ajustes em memória a nível de módulo: intencional para deploy
// self-hosted (VPS, processo único). O cache expira por TTL e é recarregado
// na próxima consulta — não há invalidação a cada novo feedback (proposital:
// o ajuste reflete o estado agregado no momento da leitura).
let adjustmentsCache: ScoreAdjustment[] | null = null
let lastAdjustmentUpdate: number = 0

// --- Parâmetros de agregação de feedback ---
const MIN_FEEDBACKS = 3
const FEEDBACK_CONFIDENCE_DIVISOR = 10
const HIGH_APPROVAL_THRESHOLD = 0.8
const LOW_APPROVAL_THRESHOLD = 0.3
const BOOST_HIGH_APPROVAL_BASE = 0.1
const BOOST_LOW_APPROVAL_BASE = -0.1
const BOOST_APPROVAL_SLOPE = 0.5
const MAX_FEEDBACK_ADJUSTMENT = 0.3

// --- Penalidades de tópico (aplicadas após o ajuste por feedback) ---
const TOPICAL_PENALTY = 0.3
const NON_GASTRIC_PENALTY = 0.45
const COLYRIUM_PENALTY = 0.6

// Penalidade para medicamentos que não estão "Ativo": o embedding mistura
// registros suspensos/cancelados com os ativos e eles dominam o topo por terem
// scores brutos maiores. Para UX, o ativo equivalente deve subir.
const INACTIVE_STATUS_PENALTY = 0.06

// Resultados com score <= MIN_RELEVANT_SCORE são removidos (falsos positivos
// severos). O threshold de 0.15 era muito agressivo: resultados puramente
// keyword (sem suporte semântico) têm scores típicos de 10-14%, sendo
// cortados. Reduzido para 0.08 para preservar resultados keyword relevantes.
const MIN_RELEVANT_SCORE = 0.08

const TOPICAL_SIGNALS = ['topico', 'topica', 'top.', 'creme', 'pomada', 'gel', 'adesivo', 'uso topico', 'uso tópico']

// Classes que NÃO são de estômago/sistema digestivo
const NON_GASTRIC_SIGNALS = [
  'oftalmologico', 'oftalmico', 'ocular', 'colirio', 'colírio', 'glaucoma', 'pressao intraocular', 'pressão intraocular',
  'osseo', 'osso', 'bifosfonato', 'osteoporose', 'calcio', 'cálcio', 'densidade ossea', 'densidade óssea',
  'ginecologico', 'ginecologia',
  'dermatologico', 'pele',
  'oncologico', 'antineoplasico', 'quimioterapia',
  'cardiovascular', 'cardiaco', 'cardíaco',
  'angina', 'antianginoso', 'vasodilatador', 'coronari', 'isquemia',
  'respiratorio', 'pulmao', 'pulmão', 'broncodilatador',
  'neurologico', 'neurológico',
  'psiquiatrico', 'psiquiátrico',
  'urologico', 'urológico', 'urinario', 'urinário', 'uretral', 'ureter',
  'bexiga', 'bexiga hiperativa', 'vias urinarias', 'vias urinárias', 'trato urinario', 'trato urinário',
  'incontinencia', 'incontinência', 'disuria', 'disúria', 'miccao', 'micção', 'jato urinario', 'jato urinário',
  'esfincter', 'esfíncter', 'prostata', 'próstata',
  'oxibutinina', 'tolterodina', 'solifenacina', 'darifenacina', 'fesoterodina', 'mirabegron', 'genurin',
  'antibiotico', 'antibiótico', 'antimicrobiano',
  'vacina', 'imunizacao', 'imunização',
  'motilidade intestinal', 'intestino irritavel', 'intestino irritável', 'constipacao', 'constipação',
]

// --- Nomes comerciais que "enganam o embedding" ---
// Ex: Stomup parece "estômago" mas é colírio. Mecanismo de segurança que só
// dispara em buscas relacionadas a estômago (guard de tópico abaixo).
const DECEPTIVE_NAME_PATTERNS = [
  { nome: 'stom', classe: 'oftalmico', penalty: 0.4 }, // Stomup = colírio
  { nome: 'genurin', classe: 'urinario', penalty: 0.4 }, // Genurin = oxibutinina (bexiga)
  { nome: 'quicard', classe: 'antianginoso', penalty: 0.4 }, // Quicard = angina/trimetazidina
]

// Buscar ajustes do banco de dados baseados em feedback
async function loadAdjustmentsFromDb(): Promise<ScoreAdjustment[]> {
  const now = Date.now()

  // Usar cache se ainda válido
  if (adjustmentsCache && (now - lastAdjustmentUpdate) < SEARCH.CACHE_TTL_MS) {
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
    if (total < MIN_FEEDBACKS) continue

    const approvalRate = data.helpful / total
    const confidence = Math.min(total / FEEDBACK_CONFIDENCE_DIVISOR, 1) // Mais feedbacks = mais confiança

    let boost = 0

    if (approvalRate >= HIGH_APPROVAL_THRESHOLD) {
      // Alta aprovação: aumentar score
      boost = BOOST_HIGH_APPROVAL_BASE + (approvalRate - HIGH_APPROVAL_THRESHOLD) * BOOST_APPROVAL_SLOPE
    } else if (approvalRate <= LOW_APPROVAL_THRESHOLD) {
      // Baixa aprovação: reduzir score
      boost = BOOST_LOW_APPROVAL_BASE - (LOW_APPROVAL_THRESHOLD - approvalRate) * BOOST_APPROVAL_SLOPE
    }

    if (boost !== 0) {
      adjustments.push({
        query,
        medicineId,
        boost: Math.max(-MAX_FEEDBACK_ADJUSTMENT, Math.min(MAX_FEEDBACK_ADJUSTMENT, boost)),
        confidence,
      })
    }
  }

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
  tradeName?: string | null;
  status?: string | null;
}>(
  query: string,
  results: { score: number; medicine: T }[]
): Promise<{ score: number; medicine: T }[]> {
  if (results.length === 0) return results

  const adjustments = await loadAdjustmentsFromDb()
  const normalizedQuery = normalizeQuery(query)

  const isStomachTopic =
    normalizedQuery.includes('estomago') || normalizedQuery.includes('estômago') ||
    normalizedQuery.includes('gastrico') || normalizedQuery.includes('gástrico') ||
    normalizedQuery.includes('azia') || normalizedQuery.includes('refluxo')

  return results.map(r => {
    let totalBoost = 0
    const medicineTherapeuticClass = r.medicine.therapeuticClass?.toLowerCase() || ''
    const medicineIndications = r.medicine.indications?.toLowerCase() || ''
    const medicineIngredient = r.medicine.activeIngredient?.toLowerCase() || ''
    const medicineTradeName = r.medicine.tradeName?.toLowerCase() || ''
    const combinedProfile = [
      medicineTherapeuticClass,
      medicineIndications,
      medicineIngredient,
    ].join(' ')

    for (const adj of adjustments) {
      // Verificar se o ajuste se aplica (query normalizada contém a palavra-chave OU vice-versa)
      if (normalizedQuery.includes(adj.query) || adj.query.includes(normalizedQuery)) {
        if (adj.medicineId === r.medicine.id) {
          totalBoost += adj.boost * adj.confidence
        }
      }
    }

    // Aplicar penalidade para medicamentos tópicos em buscas de "dor de cabeça"
    if (normalizedQuery.includes('dor de cabeça') || normalizedQuery.includes('cefaleia')) {
      const isTopical = TOPICAL_SIGNALS.some(signal => combinedProfile.includes(signal))
      if (isTopical) {
        totalBoost -= TOPICAL_PENALTY
      }
    }

    // --- Penalidades para "remédio para estômago" ---
    if (isStomachTopic) {
      const isNonGastric = NON_GASTRIC_SIGNALS.some(signal => combinedProfile.includes(signal))
      if (isNonGastric) {
        totalBoost -= NON_GASTRIC_PENALTY
      }

      // Penalidade extra para colírios (engana o embedding)
      if (medicineTherapeuticClass.includes('oftalmico') || medicineTherapeuticClass.includes('oftalmologico') || medicineTherapeuticClass.includes('colirio')) {
        totalBoost -= COLYRIUM_PENALTY
      }

      for (const pattern of DECEPTIVE_NAME_PATTERNS) {
        const nameMatches = medicineTradeName !== '' && medicineTradeName.includes(pattern.nome)
        const classMatches = combinedProfile.includes(pattern.classe)
        if (nameMatches || classMatches) {
          totalBoost -= pattern.penalty
        }
      }
    }

    // Prioridade para medicamentos Ativos: registros inativos/suspensos/cancelados
    // recebem uma penalidade moderada (embedding não distingue status).
    if (r.medicine.status && r.medicine.status !== 'Ativo') {
      totalBoost -= INACTIVE_STATUS_PENALTY
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
  .filter(r => r.score > MIN_RELEVANT_SCORE)
}