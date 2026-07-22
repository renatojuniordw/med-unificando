import "dotenv/config"
import { hybridSearch } from '../src/lib/actions/semantic-search'

async function test(query: string) {
  console.log(`\n=== BUSCA: "${query}" ===`)
  const start = Date.now()
  const results = await hybridSearch(query, 20)
  const elapsed = Date.now() - start
  
  if (results.length === 0) {
    console.log(`❌ Nenhum resultado (${elapsed}ms)`)
    return { query, total: 0, elapsed, topNames: [] }
  }
  
  console.log(`✅ ${results.length} resultados (${elapsed}ms)`)
  
  const top10 = results.slice(0, 10)
  top10.forEach((r, i) => {
    const status = r.medicine.status === 'Ativo' ? '🟢' : '🔴'
    console.log(`  ${i+1}. ${status} [${(r.score*100).toFixed(0)}%] ${r.medicine.tradeName} | ${r.medicine.activeIngredient?.substring(0, 50)} | ${r.medicine.therapeuticClass || 'sem classe'}`)
  })
  
  // Check for known false positives
  const tradeNames = results.map(r => (r.medicine.tradeName || '').toLowerCase())
  const falsePositives: string[] = []
  
  // False positives for "estomago"
  if (query.toLowerCase().includes('estomago') || query.toLowerCase().includes('gastr')) {
    if (tradeNames.some(n => n.includes('stomup'))) falsePositives.push('Stomup (colírio)')
    if (tradeNames.some(n => n.includes('osteoblock') || n.includes('osteofar'))) falsePositives.push('Osteoblock/Osteofar (osso)')
    if (tradeNames.some(n => n.includes('olmetrat'))) falsePositives.push('Olmetrat (pressão)')
    if (tradeNames.some(n => n.includes('zelmac'))) falsePositives.push('Zelmac (intestino)')
    if (tradeNames.some(n => n.includes('oxlumo'))) falsePositives.push('Oxlumo (renal)')
  }
  
  // False positives for "dor de cabeça"
  if (query.toLowerCase().includes('cabeça') || query.toLowerCase().includes('cefaleia')) {
    if (tradeNames.some(n => n.includes('moment'))) falsePositives.push('Moment (falso)')
  }
  
  if (falsePositives.length > 0) {
    console.log(`\n⚠️  FALSOS POSITIVOS ENCONTRADOS:`)
    falsePositives.forEach(fp => console.log(`  ❌ ${fp}`))
  } else {
    console.log(`\n✅ Sem falsos positivos conhecidos`)
  }
  
  return { query, total: results.length, elapsed, topNames: results.slice(0, 5).map(r => r.medicine.tradeName) }
}

async function main() {
  try {
    const tests = [
      'remédio para estômago',
      'dor de cabeça',
      'remédio para pressão',
      'anti-inflamatório para articulação',
      'dipirona',
      'omeprazol',
      'antibiótico',
      'colírio',
    ]
    
    const results = []
    for (const q of tests) {
      const r = await test(q)
      results.push(r)
    }
    
    console.log('\n═══════════════════════════════════════')
    console.log('           RESUMO DOS TESTES          ')
    console.log('═══════════════════════════════════════')
    console.log(`  Query                          | Qtd  | Tempo  `)
    console.log(`  ${'-'.repeat(35)} | ${'-'.repeat(4)} | ${'-'.repeat(6)}`)
    for (const r of results) {
      const q = r.query.padEnd(35)
      const t = String(r.total).padStart(4)
      const e = `${r.elapsed}ms`.padStart(6)
      const status = r.total > 0 ? '✅' : '❌'
      console.log(`  ${q} | ${t} | ${e}`)
    }
  } catch (err) {
    console.error('ERRO:', err)
  }
}

main()
