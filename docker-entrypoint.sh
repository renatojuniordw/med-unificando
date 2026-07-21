#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Rodando seed (admin + import inicial, idempotente)..."
npx tsx prisma/seed.ts

exec "$@"
