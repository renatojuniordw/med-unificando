#!/bin/sh
# ============================================================================
# docker-entrypoint.sh — medicamentos
# Inicializa o banco (schema, seed, embeddings, tsvector) na primeira vez.
# ============================================================================
set -e

# ── 1. Aguardar PostgreSQL ─────────────────────────────────────────────────
echo "⏳ Aguardando PostgreSQL..."
until pg_isready -h db -U admin -d medicamentos 2>/dev/null; do
  sleep 2
done
echo "✅ PostgreSQL pronto!"

# ── 2. Schema ──────────────────────────────────────────────────────────────
echo "🔧 Sincronizando schema..."
npx prisma db push --accept-data-loss 2>&1
echo "✅ Schema ok!"

# ── 3. Verificar se já populou (se sim, pula init) ─────────────────────────
echo "🔍 Verificando dados existentes..."
MED_COUNT=$(psql "$DATABASE_URL" -Atc "SELECT COUNT(*) FROM medicines;" 2>/dev/null || echo "0")
echo "   Medicamentos no banco: $MED_COUNT"

if [ "$MED_COUNT" != "0" ]; then
  echo "⏩ Banco já populado — pulando init."
else
  echo "📥 Banco vazio — seed ANVISA..."
  echo "   Baixando CSVs da ANVISA (pode levar minutos)..."
  npx tsx prisma/seed.ts 2>&1
  echo "✅ Seed concluído!"

  echo "🧠 Embeddings (~5-15 min)..."
  npx tsx scripts/generate-search-index.ts 2>&1
  echo "✅ Embeddings ok!"

  echo "📑 Tsvector..."
  npx tsx scripts/generate-tsvector.ts 2>&1
  echo "✅ Tsvector ok!"
fi

# ── 4. Iniciar servidor ────────────────────────────────────────────────────
echo "🚀 Iniciando Next.js..."
exec "$@"
