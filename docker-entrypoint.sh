#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Rodando seed (admin + import inicial, idempotente)..."
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts

echo "Sincronizando Farmácia Popular..."
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/sync-farmacia-popular.ts

echo "Verificando embeddings de busca semântica..."
EMBEDDING_COUNT=$(npx prisma query 'SELECT COUNT(*) as count FROM medicines WHERE embedding IS NOT NULL' --no-plaintext 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
TOTAL=$(npx prisma query 'SELECT COUNT(*) as count FROM medicines' --no-plaintext 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)

if [ "$EMBEDDING_COUNT" != "$TOTAL" ]; then
  echo "Gerando embeddings ($EMBEDDING_COUNT/$TOTAL)... isso pode levar alguns minutos."
  npm run search-index
else
  echo "Embeddings OK ($EMBEDDING_COUNT/$TOTAL)."
fi

exec "$@"
