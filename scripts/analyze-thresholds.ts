// Script simplificado para analisar os thresholds de qualidade
// Não requer execução - apenas análise estática do código

console.log('📊 Análise dos Thresholds de Qualidade')
console.log('=' .repeat(60))

const thresholds = {
  high: 0.55,    // Alta correspondência
  medium: 0.3,   // Correspondência parcial
  low: 0.0       // Baixa correspondência
}

console.log('\n🎯 Thresholds Atuais:')
console.log(`   Alta correspondência: >= ${(thresholds.high * 100).toFixed(0)}%`)
console.log(`   Correspondência parcial: >= ${(thresholds.medium * 100).toFixed(0)}%`)
console.log(`   Baixa correspondência: < ${(thresholds.medium * 100).toFixed(0)}%`)

console.log('\n🔍 Problema Identificado:')
console.log('   Medicamentos clássicos (Celecoxibe, Meloxicam, Nimesulida)')
console.log('   estão recebendo scores ~26%, caindo em "Baixa correspondência"')
console.log('   mesmo tendo indicações compatíveis.')

console.log('\n💡 Possíveis Causas:')
console.log('   1. Cosine similarity pode estar baixo para esses medicamentos')
console.log('   2. Ts_rank pode estar baixo (menos termos de keyword)')
console.log('   3. Thresholds podem estar muito altos para alguns casos')

console.log('\n🛠️  Soluções Possíveis:')
console.log('   1. Ajustar thresholds (reduzir min para alta)')
console.log('   2. Melhorar cálculo de score (aumentar peso keyword)')
console.log('   3. Adicionar lógica de "boost" para medicamentos clássicos')

console.log('\n📈 Análise do Cálculo Atual:')
console.log('   honestScore = SEMANTIC_WEIGHT * semanticComponent + KEYWORD_WEIGHT * keywordComponent')
console.log('   onde:')
console.log('   - SEMANTIC_WEIGHT = 0.60')
console.log('   - KEYWORD_WEIGHT = 0.40')
console.log('   - semanticComponent = clamp((cosine - 0.80) / (0.92 - 0.80), 0, 1)')
console.log('   - keywordComponent = min(ts_rank / 0.1, 1)')

console.log('\n🧪 Exemplo Simulado:')
const exampleCosine = 0.85  // Exemplo para Celecoxibe
const exampleTsRank = 0.03  // Exemplo para Celecoxibe

const semanticComponent = Math.min(Math.max((exampleCosine - 0.80) / (0.92 - 0.80), 0), 1)
const keywordComponent = Math.min(exampleTsRank / 0.1, 1)
const finalScore = 0.60 * semanticComponent + 0.40 * keywordComponent

console.log(`   Cosine similarity: ${exampleCosine}`)
console.log(`   Ts_rank: ${exampleTsRank}`)
console.log(`   Semantic component: ${semanticComponent.toFixed(3)}`)
console.log(`   Keyword component: ${keywordComponent.toFixed(3)}`)
console.log(`   Final score: ${(finalScore * 100).toFixed(1)}%`)
console.log(`   Classificação: ${finalScore >= 0.55 ? '🟢 Alta' : finalScore >= 0.3 ? '🟡 Parcial' : '🔴 Baixa'}`)

console.log('\n🎯 Recomendação:')
console.log('   O problema é que o ts_rank para medicamentos específicos')
console.log('   pode ser baixo mesmo sendo relevantes. Considere:')
console.log('   1. Aumentar KEYWORD_SATURATION de 0.1 para 0.15')
console.log('   2. Ou reduzir o threshold de alta de 0.55 para 0.50')
console.log('   3. Ou adicionar um "boost" baseado na classe terapêutica')