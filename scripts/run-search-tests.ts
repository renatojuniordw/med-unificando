// Script de teste automatizado da busca híbrida
// Executa múltiplos cenários e valida os resultados

import { hybridSearch, clearEmbeddingsCache } from '../src/lib/actions/semantic-search'

interface TestCase {
  name: string
  query: string
  validate: (results: { score: number; medicine: { tradeName: string; activeIngredient: string; indications?: string | null; therapeuticClass?: string | null } }[]) => string[]
}

const TESTS: TestCase[] = [
  {
    name: 'remédio para estômago',
    query: 'remédio para estômago',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      
      console.log(`  ${results.length} resultados`)
      
      // Verificar falsos positivos conhecidos
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      const falsePositives = ['stomup', 'osteoblock', 'estradiol', 'urimed', 'antimoniato', 'oxlumo', 'zelmac', 'olmetrat']
      
      for (const fp of falsePositives) {
        const found = tradeNames.find(t => t.includes(fp))
        if (found) {
          errors.push(`❌ Falso positivo encontrado: ${found}`)
        }
      }
      
      // Verificar se tem resultados gástricos legítimos
      const gastricTerms = ['esomeprazol', 'omeprazol', 'pantoprazol', 'estomadefens', 'estomanol']
      const hasGastric = gastricTerms.some(gt => tradeNames.some(t => t.includes(gt)))
      if (!hasGastric) {
        errors.push('⚠️ Nenhum medicamento gástrico conhecido encontrado')
      }
      
      return errors
    },
  },
  {
    name: 'dor de cabeça',
    query: 'dor de cabeça',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      console.log(`  ${results.length} resultados`)
      
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      
      // Moment/Capsaicina não deve aparecer no topo
      const momentIdx = tradeNames.findIndex(t => t.includes('moment'))
      if (momentIdx >= 0 && momentIdx < 5) {
        errors.push(`❌ Moment (Capsaicina) aparece na posição ${momentIdx + 1} (deveria estar no fim ou ausente)`)
      }
      
      // Deve ter analgésicos
      const analgesicos = ['dipirona', 'ibuprofeno', 'paracetamol', 'acetaminofeno']
      const hasAnalgesico = analgesicos.some(a => tradeNames.some(t => t.includes(a)))
      if (!hasAnalgesico) {
        errors.push('⚠️ Nenhum analgésico comum encontrado')
      }
      
      return errors
    },
  },
  {
    name: 'remédio para pressão',
    query: 'remédio para pressão',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      console.log(`  ${results.length} resultados`)
      
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      
      // Deve ter anti-hipertensivos
      const antihipertensivos = ['losartana', 'enalapril', 'anlodipino', 'captopril', 'ramipril']
      const hasAnti = antihipertensivos.some(a => tradeNames.some(t => t.includes(a)))
      if (!hasAnti) {
        errors.push('⚠️ Nenhum anti-hipertensivo comum encontrado')
      }
      
      return errors
    },
  },
  {
    name: 'anti-inflamatório para articulação',
    query: 'anti-inflamatório para articulação',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      console.log(`  ${results.length} resultados`)
      
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      const antiInflamatorios = ['ibuprofeno', 'diclofenaco', 'naproxeno', 'nimesulida', 'meloxicam', 'piroxicam']
      const hasAnti = antiInflamatorios.some(a => tradeNames.some(t => t.includes(a)))
      if (!hasAnti) {
        errors.push('⚠️ Nenhum anti-inflamatório comum encontrado')
      }
      
      return errors
    },
  },
  {
    name: 'ibuprofeno (princípio ativo)',
    query: 'ibuprofeno',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      console.log(`  ${results.length} resultados`)
      
      // Todos devem conter Ibuprofeno no princípio ativo
      for (const r of results) {
        if (!r.medicine.activeIngredient.toLowerCase().includes('ibuprofeno')) {
          errors.push(`❌ ${r.medicine.tradeName} não contém Ibuprofeno (ingrediente: ${r.medicine.activeIngredient})`)
          break
        }
      }
      
      return errors
    },
  },
  {
    name: 'paracetamol (princípio ativo)',
    query: 'paracetamol',
    validate: (results) => {
      const errors: string[] = []
      if (results.length === 0) {
        errors.push('❌ NENHUM resultado retornado')
        return errors
      }
      console.log(`  ${results.length} resultados`)
      
      for (const r of results) {
        if (!r.medicine.activeIngredient.toLowerCase().includes('paracetamol') && 
            !r.medicine.activeIngredient.toLowerCase().includes('acetaminofeno')) {
          errors.push(`❌ ${r.medicine.tradeName} não contém Paracetamol`)
          break
        }
      }
      
      return errors
    },
  },
]

async function runTests() {
  console.log('🧪 INICIANDO TESTES DE BUSCA')
  console.log('=' .repeat(60))
  
  let passed = 0
  let failed = 0
  
  for (const test of TESTS) {
    console.log(`\n📋 Teste: "${test.name}"`)
    console.log(`   Query: "${test.query}"`)
    
    try {
      const start = Date.now()
      const results = await hybridSearch(test.query, 20)
      const duration = Date.now() - start
      console.log(`   ⏱  ${(duration / 1000).toFixed(1)}s`)
      
      const errors = test.validate(results)
      
      if (errors.length === 0) {
        console.log(`   ✅ PASS`)
        passed++
      } else {
        console.log(`   ❌ FAIL`)
        for (const err of errors) {
          console.log(`      ${err}`)
        }
        failed++
      }
    } catch (err) {
      console.log(`   💥 ERRO: ${err instanceof Error ? err.message : err}`)
      failed++
    }
    
    // Limpar cache entre testes
    await clearEmbeddingsCache()
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log(`📊 RESULTADO: ${passed} passaram, ${failed} falharam de ${TESTS.length} testes`)
  
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})