import { hybridSearch } from '../src/lib/actions/semantic-search'

async function diagnoseSearch(query: string) {
  console.log(`\n🔍 Diagnosticando busca: "${query}"`)
  console.log('=' .repeat(60))
  
  const results = await hybridSearch(query, 20)
  
  console.log(`\n📊 Resultados encontrados: ${results.length}`)
  console.log('\n📋 Top 10 resultados com scores detalhados:')
  
  results.slice(0, 10).forEach((r, i) => {
    const scorePercent = (r.score * 100).toFixed(1)
    const relevance = r.score >= 0.55 ? '🟢 Alta' : 
                     r.score >= 0.3 ? '🟡 Parcial' : '🔴 Baixa'
    
    console.log(`${i + 1}. ${r.medicine.tradeName}`)
    console.log(`   Score: ${scorePercent}% ${relevance}`)
    console.log(`   Indicação: ${r.medicine.indications || 'Não informada'}`)
    console.log(`   Classe Terapêutica: ${r.medicine.therapeuticClass || 'Não informada'}`)
    console.log('')
  })
  
  // Análise de distribuição
  const scores = results.map(r => r.score)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  
  console.log('📈 Estatísticas:')
  console.log(`   Média: ${(avg * 100).toFixed(1)}%`)
  console.log(`   Mínimo: ${(min * 100).toFixed(1)}%`)
  console.log(`   Máximo: ${(max * 100).toFixed(1)}%`)
  
  // Identificar medicamentos com score baixo mas indicação relevante
  console.log('\n⚠️  Medicamentos com score baixo mas indicação relevante:')
  const lowScoreWithRelevantIndication = results.filter(r => {
    const hasLowScore = r.score < 0.3
    const hasRelevantIndication = r.medicine.indications?.toLowerCase().includes('anti-inflamatório') ||
                                  r.medicine.indications?.toLowerCase().includes('dor') ||
                                  r.medicine.indications?.toLowerCase().includes('inflamação')
    return hasLowScore && hasRelevantIndication
  })
  
  if (lowScoreWithRelevantIndication.length > 0) {
    lowScoreWithRelevantIndication.forEach(r => {
      console.log(`   - ${r.medicine.tradeName}: ${(r.score * 100).toFixed(1)}%`)
      console.log(`     Indicação: ${r.medicine.indications}`)
    })
  } else {
    console.log('   Nenhum encontrado')
  }
}

// Executar diagnóstico para os 3 cenários
async function main() {
  await diagnoseSearch('dor de cabeça')
  await diagnoseSearch('remédio para pressão')
  await diagnoseSearch('anti-inflamatório para articulação')
}

main().catch(console.error)