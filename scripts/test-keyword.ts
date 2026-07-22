import { keywordSearch } from '../src/lib/actions/keyword-search'

async function test() {
  console.log('=== Testando keywordSearch ===')
  
  const results = await keywordSearch('remédio para estômago', 40)
  console.log(`Resultados: ${results.length}`)
  
  if (results.length > 0) {
    console.log('Top 5:')
    results.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i+1}. medicineId: ${r.medicineId}, keywordScore: ${r.keywordScore}`)
    })
  }
  
  console.log('\n=== Testando keywordSearch com termo simplificado ===')
  const results2 = await keywordSearch('gastrite', 40)
  console.log(`Resultados para 'gastrite': ${results2.length}`)
  if (results2.length > 0) {
    results2.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i+1}. medicineId: ${r.medicineId}, keywordScore: ${r.keywordScore}`)
    })
  }
}

test().catch(console.error)