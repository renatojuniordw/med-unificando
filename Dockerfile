# ============================================================================
# Dockerfile — medicamentos (Next.js 16 + Prisma + pgvector)
# ============================================================================
# Build stage
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig.json next.config.ts postcss.config.mjs prisma.config.ts ./
RUN npx prisma generate

COPY . .

RUN npm run build

# ============================================================================
# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Non-root user (UID 1001)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

RUN apt-get update && apt-get install -y --no-install-recommends curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /tmp/.transformers-cache && \
    chmod +x ./docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app /tmp/.transformers-cache

USER nextjs

EXPOSE 11006

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
