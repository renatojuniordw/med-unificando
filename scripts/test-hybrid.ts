import { hybridSearch } from '../src/lib/actions/semantic-search'

async function main() {
  console.log("=== hybridSearch: dor de cabeça ===")
  const results = await hybridSearch("dor de cabeça", 20)
  console.log(`Resultados: ${results.length}`)
  results.forEach((r, i) => {
    console.log(`  ${i+1}. "${r.medicine.tradeName}" score: ${(r.score*100).toFixed(1)}%`)
  })
}
main().catch(console.error)
