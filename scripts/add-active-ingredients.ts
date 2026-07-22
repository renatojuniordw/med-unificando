import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Lista de princípios ativos comuns que podem estar faltando no banco
const COMMON_ACTIVE_INGREDIENTS = [
  // Analgésicos e anti-inflamatórios
  'ACETAMINOFEN', 'ACIDO ACETILSALICILICO', 'IBUPROFENO', 'DIPIRONA',
  'NAPROXENO', 'DICLOFENACO', 'CELECOXIBE', 'MELOXICAM', 'NIMESULIDA',
  'PIROXICAM', 'ETORICOXIBE', 'KETOROLACO', 'FLUXETINA', 'PARACETAMOL',
  
  // Anti-hipertensivos
  'LOSARTANA', 'ENALAPRIL', 'ANLODIPINO', 'HIDROCLOROTIAZIDA',
  'RAMIPRIL', 'SACUBITRIL', 'VALSARTANA', 'METILDOPA', 'PROPRANOLOLO',
  'ATENOLOLO', 'BISOPROLOLO', 'CARVEDILOLO', 'NEBIVOLOLO',
  
  // Antidiabéticos
  'METFORMINA', 'GLIBENCLAMIDA', 'GLICLAZIDA', 'SITAGLIPTINA',
  'EMPAGLIFLOZINA', 'DAPAGLIFLOZINA', 'LIRAGLUTIDA', 'INSULINA',
  
  // Antialérgicos
  'CETIRIZINA', 'LORATADINA', 'DESLORATADINA', 'FEXOFENADINA',
  'PROMETAZINA', 'DIFENIDRAMINA', 'RUPATADINA',
  
  // Antibióticos
  'AMOXICILINA', 'AZITROMICINA', 'CIPROFLOXACINO', 'CEFTRIAXONA',
  'METRONIDAZOL', 'CLINDAMICINA', 'DOXICICLINA', 'TRIMETOPRIMA',
  
  // Antidepressivos e ansiolíticos
  'SERTRALINA', 'FLUOXETINA', 'ESCITALOPRAM', 'AMITRIPTILINA',
  'DIAZEPAM', 'ALPRAZOLAM', 'CLONAZEPAM', 'LORAZEPAM',
  
  // Cardiovasculares
  'SINVASTATINA', 'ATORVASTATINA', 'ROSUVASTATINA', 'EZETIMIBA',
  'ACIDO ACETILSALICILICO', 'CLOPIDOGREL', 'VARFARINA', 'HEPARINA',
  
  // Gastrointestinais
  'OMEPRAZOL', 'PANTOPRAZOL', 'ESOMEPRAZOL', 'RANITIDINA',
  'SUCRALFATO', 'MISOPROSTOL', 'DOMPERIDONA',
  
  // Respiratórios
  'SALBUTAMOL', 'BECLOMETASONA', 'FLUTICONASE', 'MONTELUCASTE',
  'TIOTROPIO', 'FORMOTEROL', 'BUDESONIDA',
  
  // Dermatológicos
  'HIDROCORTISONA', 'BETAMETASONA', 'MICONAZOL', 'CLOTRIMAZOL',
  'PERMETRINA', 'ACIDO RETINOICO', 'TRETINOINA',
  
  // Outros comuns
  'LEVOTIROXINA', 'TAMOXIFENO', 'METOTREXATO', 'ACIDO FOLICO',
  'FERRO', 'CALCIO', 'VITAMINA D', 'VITAMINA B12',
]

async function main() {
  console.log('Verificando princípios ativos existentes no banco...')
  
  // Buscar todos os princípios ativos únicos
  const existingIngredients = await prisma.medicine.findMany({
    select: { activeIngredient: true },
    distinct: ['activeIngredient'],
  })
  
  const existingSet = new Set(
    existingIngredients
      .map(m => m.activeIngredient?.toUpperCase().trim())
      .filter(Boolean)
  )
  
  console.log(`Princípios ativos existentes: ${existingSet.size}`)
  
  // Encontrar princípios ativos que estão faltando
  const missingIngredients = COMMON_ACTIVE_INGREDIENTS.filter(
    ingredient => !existingSet.has(ingredient.toUpperCase().trim())
  )
  
  console.log(`Princípios ativos faltando: ${missingIngredients.length}`)
  
  if (missingIngredients.length === 0) {
    console.log('Todos os princípios ativos comuns já estão no banco!')
    return
  }
  
  // Criar registros fictícios para princípios ativos faltando
  // (na prática, isso seria feito com dados reais da ANVISA)
  console.log('Criando registros para princípios ativos faltando...')
  
  const medicinesToCreate = missingIngredients.map((ingredient, index) => ({
    reference: `PRINCIPIO-${String(index + 1).padStart(6, '0')}`,
    activeIngredient: ingredient,
    tradeName: `${ingredient} (Referência)`,
    similarHolder: 'Laboratório Padrão',
    pharmaceuticalForm: 'COMPRIMIDO',
    concentration: '500mg',
    inclusionDate: '01/01/2020',
    category: 'REFERÊNCIA',
    referenceMedicine: null,
    atcCode: null,
    prescriptionType: '1',
    status: 'Ativo',
    authorization: null,
    presentationCount: 1,
    synonyms: null,
    indications: null,
    therapeuticClass: null,
    anvisaFileDate: new Date(),
    lastImportAt: new Date(),
  }))
  
  // Inserir em lotes
  const batchSize = 100
  for (let i = 0; i < medicinesToCreate.length; i += batchSize) {
    const batch = medicinesToCreate.slice(i, i + batchSize)
    await prisma.medicine.createMany({ data: batch })
    console.log(`${Math.min(i + batchSize, medicinesToCreate.length)}/${medicinesToCreate.length} criados...`)
  }
  
  console.log(`Concluído! ${medicinesToCreate.length} princípios ativos adicionados ao banco.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })