import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Política de retenção (dias) — alinhada à política de privacidade (seção Retenção).
// Configurável via env; padrão 365 dias (12 meses).
const SEARCH_LOGS_RETENTION_DAYS = parseInt(process.env.SEARCH_LOGS_RETENTION_DAYS ?? "365", 10)
const FEEDBACK_RETENTION_DAYS = parseInt(process.env.SEARCH_FEEDBACK_RETENTION_DAYS ?? "365", 10)

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })

  // search_logs é tabela crua (sem model no Prisma): purge via SQL parametrizado.
  const logsCutoff = daysAgo(SEARCH_LOGS_RETENTION_DAYS)
  const logsDeleted = await prisma.$executeRaw`
    DELETE FROM search_logs
    WHERE created_at < ${logsCutoff}
  `

  const feedbackCutoff = daysAgo(FEEDBACK_RETENTION_DAYS)
  const feedbackDeleted = await prisma.searchFeedback.deleteMany({
    where: { createdAt: { lt: feedbackCutoff } },
  })

  console.log(
    `Purge concluído: ${logsDeleted} search_logs (>${SEARCH_LOGS_RETENTION_DAYS}d) e ` +
    `${feedbackDeleted.count} search_feedback (>${FEEDBACK_RETENTION_DAYS}d) removidos.`
  )

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("Falha no purge:", err)
  process.exit(1)
})