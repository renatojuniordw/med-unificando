#!/bin/sh
# ============================================================================
# docker-entrypoint.sh — medicamentos
# Inicializa o banco (schema, seed, embeddings, tsvector) na primeira vez.
# ============================================================================
set -e

# ── 0. Forçar DATABASE_URL para o serviço db do Docker ────────────────────
# O prisma.config.ts carrega dotenv/config, que pode puxar o .env local
# com DATABASE_URL apontando para localhost. Nós anulamos isso aqui.
export DATABASE_URL="postgresql://admin:${DB_PASSWORD:?DB_PASSWORD não definida}@db:5432/medicamentos"
echo "📌 DATABASE_URL forçado para host 'db' do Docker"

# ── 1. Aguardar PostgreSQL ─────────────────────────────────────────────────
echo "⏳ Aguardando PostgreSQL..."
until pg_isready -h db -U admin -d medicamentos 2>/dev/null; do
  sleep 2
done
echo "✅ PostgreSQL pronto!"

# ── 2. Schema (migrate seguro) ─────────────────────────────────────────────
echo "🔧 Aplicando migrations..."
npx prisma migrate deploy 2>&1
echo "✅ Schema ok!"

# ── 3. Verificar se já populou (se sim, pula init) ─────────────────────────
echo "🔍 Verificando dados existentes..."
MED_COUNT=$(psql "$DATABASE_URL" -Atc "SELECT COUNT(*) FROM medicines;" 2>/dev/null || echo "0")
echo "   Medicamentos no banco: $MED_COUNT"

if [ "$MED_COUNT" != "0" ]; then
  echo "⏩ Banco já populado — pulando init."
else
  echo "📥 Banco vazio — seed ANVISA + dados auxiliares..."
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts 2>&1
  echo "✅ Seed concluído!"

  echo "🏪 Sincronizando Farmácia Popular..."
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/sync-farmacia-popular.ts 2>&1
  echo "✅ Farmácia Popular OK!"

  echo "📋 Preenchendo indications a partir da classe terapêutica..."
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/backfill-indications.ts 2>&1
  echo "✅ Indicações OK!"

  echo "🧠 Gerando embeddings de busca semântica..."
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-search-index.ts 2>&1
  echo "✅ Embeddings OK!"

  echo "📑 Gerando tsvector..."
  npx tsx scripts/generate-tsvector.ts 2>&1
  echo "✅ Tsvector OK!"
fi

# ── 4. Iniciar servidor ────────────────────────────────────────────────────
echo "🚀 Iniciando Next.js..."
exec "$@"
