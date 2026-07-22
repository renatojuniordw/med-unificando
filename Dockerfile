# ============================================================================
# Dockerfile — medicamentos (Next.js 16 + Prisma + pgvector)
# ============================================================================
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Dependências do sistema para compilação nativa (transformers, sharp, etc.)
RUN apk add --no-cache python3 make g++ git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ============================================================================
# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++ git curl postgresql-client

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/lib/dictionaries ./src/lib/dictionaries

# Entrypoint que fará init automático (seed, embeddings, tsvector)
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 11006

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "node_modules/.bin/next", "start", "-p", "11006"]
