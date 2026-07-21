import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const FARMACIA_POPULAR_ATIVOS = [
  'BROMETO DE IPRATROPIO',
  'DIPROPIONATO DE BECLOMETASONA',
  'SULFATO DE SALBUTAMOL',
  'CLORIDRATO DE METFORMINA',
  'METFORMINA',
  'GLIBENCLAMIDA',
  'INSULINA HUMANA',
  'ATENOLOL',
  'BESILATO DE ANLODIPINO',
  'ANLODIPINO',
  'CAPTOPRIL',
  'CLORIDRATO DE PROPRANOLOL',
  'PROPRANOLOL',
  'HIDROCLOROTIAZIDA',
  'LOSARTANA POTASSICA',
  'LOSARTANA',
  'MALEATO DE ENALAPRIL',
  'ENALAPRIL',
  'ESPIRONOLACTONA',
  'FUROSEMIDA',
  'SUCCINATO DE METOPROLOL',
  'METOPROLOL',
  'ACETATO DE MEDROXIPROGESTERONA',
  'MEDROXIPROGESTERONA',
  'ETINILESTRADIOL',
  'LEVONORGESTREL',
  'NORETISTERONA',
  'VALERATO DE ESTRADIOL',
  'ENANTATO DE NORETISTERONA',
  'ALENDRONATO DE SODIO',
  'ALENDRONATO',
  'SINVASTATINA',
  'CARBIDOPA',
  'LEVODOPA',
  'CLORIDRATO DE BENSERAZIDA',
  'MALEATO DE TIMOLOL',
  'TIMOLOL',
  'BUDESONIDA',
  'DAPAGLIFLOZINA',
]

async function main() {
  console.log('Sincronizando Farmácia Popular...')

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })

  await prisma.medicine.updateMany({
    where: { farmaciaPopular: true },
    data: { farmaciaPopular: false },
  })

  const conditions = FARMACIA_POPULAR_ATIVOS.map(ativo => ({
    activeIngredient: { contains: ativo, mode: 'insensitive' as const },
  }))

  const result = await prisma.medicine.updateMany({
    where: { OR: conditions },
    data: { farmaciaPopular: true },
  })

  console.log(`${result.count} medicamentos marcados com Farmácia Popular.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
