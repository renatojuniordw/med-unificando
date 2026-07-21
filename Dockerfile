FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY src/generated/prisma ./src/generated/prisma
COPY tsconfig.json next.config.ts postcss.config.mjs prisma.config.ts ./
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN apk add --no-cache curl

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /tmp && chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 11006

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
