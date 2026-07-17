# Arquitetura

## Visão Geral

Unificando Med é uma aplicação Next.js 16 (App Router) com PostgreSQL que consome dados abertos da ANVISA para fornecer consulta inteligente de medicamentos intercambiáveis brasileiros.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Navegador   │────▶│  Next.js 16  │────▶│ PostgreSQL  │
│ (Tailwind v4)│     │ (App Router) │     │   (Prisma)  │
│   (PWA)     │     │  :11006      │     │   :5432     │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Xenova/TF   │
                    │ (Embeddings) │
                    │ (LLM local)  │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  Dados Abertos│
                    │    ANVISA    │
                    │  (CSV/HTTP)  │
                    └──────────────┘
```

## Estrutura de Pastas

```
medicamentos/
├── prisma/
│   ├── schema.prisma      # Medicine, Price, User, SyncLog
│   ├── migrations/        # 7 migrations versionadas
│   ├── seed.ts            # Importa CSV ANVISA (medicamentos)
│   └── import-prices.ts   # Importa CSV CMED (preços)
├── scripts/
│   └── generate-embeddings.ts  # Gera embeddings 384d com all-MiniLM-L6-v2
├── public/
│   ├── embeddings.bin     # Float32Array raw (32585 × 384 = ~47MB)
│   ├── embeddings-header.json
│   └── manifest.json      # PWA manifest
├── src/
│   ├── app/
│   │   ├── page.tsx       # Home (busca textual + semântica)
│   │   ├── medicamento/[id]/   # Detalhes + JSON-LD + breadcrumbs + bula + gráfico + similares
│   │   ├── referencias/        # Lista + detalhe de referência
│   │   ├── atc/                # Árvore ATC + medicamentos por código
│   │   ├── detentor/[cnpj]/    # Todos medicamentos de uma empresa
│   │   ├── dashboard/          # Stats + timeline por ano
│   │   ├── compare/            # Comparação lado a lado
│   │   ├── admin/              # Login + importação
│   │   └── api/
│   │       ├── medicines/  # API REST pública (JSON/CSV)
│   │       └── health/     # Health check
│   ├── components/
│   │   ├── layout/         # Header, Footer
│   │   ├── ui/             # Button, Badge, Card, Input, Skeleton, Breadcrumbs, ScrollToTop, ClipboardButton
│   │   └── medicines/      # SearchForm, MedicineTable, SemanticSearch, CompareView, ExportButton
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── admin.ts         # syncWithAnvisa, getImportInfo (com SyncLog)
│   │   │   ├── search.ts        # searchMedicines, getDashboardStats (com timeline)
│   │   │   ├── export-action.ts # CSV + Excel
│   │   │   ├── compare.ts
│   │   │   ├── references.ts
│   │   │   ├── atc.ts
│   │   │   ├── prices.ts        # syncPrices (com SyncLog)
│   │   │   └── semantic-search.ts  # IA local server-side
│   │   ├── pdf-parser.ts
│   │   └── prisma.ts
│   ├── types/              # Interfaces TypeScript
│   └── middleware.ts       # Rate limit 60 req/min nas rotas /api/*
├── Dockerfile              # Multi-stage (node:22-alpine, non-root)
├── docker-compose.yml      # App + PostgreSQL (com healthcheck, limites, segurança)
├── .env.example
└── docs/
    ├── ARCHITECTURE.md
    ├── BUSINESS_RULES.md
    ├── USER_STORIES.md
    ├── API.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    └── DEVELOPMENT.md
```

## Fluxo de Dados

### Importação
1. Usuário admin clica "Sincronizar" ou via script `npm run seed`
2. Servidor faz HEAD no CSV remoto → verifica `Last-Modified`
3. Se alterado: baixa CSV → `iconv` (Latin-1 → UTF-8) → `xlsx` (parse) → Prisma `createMany`
4. Registra log em `SyncLog` (type, count, status)
5. Preços CMED: mesmo fluxo via `TA_PRECOS_MEDICAMENTOS.csv`

### Busca Semântica
1. One-time: `scripts/generate-embeddings.ts` → all-MiniLM-L6-v2 → 384d → 32.585 embeddings
2. Server action `semanticSearch()` carrega modelo + embeddings em memória
3. Usuário digita → query embedded → cosine similarity → top 20
4. Texto do embedding inclui: nome, princípio ativo, categoria, sinônimos, indicações

### Otimizações de SEO
1. `generateMetadata()` em cada página de detalhe → title + description + Open Graph
2. JSON-LD (Schema.org/MedicalDrug) no detalhe
3. `sitemap.ts` → 32.585+ URLs
4. `robots.ts` → permite indexação, bloqueia /admin/ e /api/

### PWA
- `manifest.json` com display standalone
- Ícones 192x192 e 512x512
- Meta tag theme-color

## Decisões Técnicas

| Decisão | Alternativa | Escolha | Motivo |
|---------|-------------|---------|--------|
| IA local vs OpenAI | API paga | Xenova Transformers | Zero custo, sem dependência externa |
| Modelo de embedding | USE, BERT | all-MiniLM-L6-v2 | 384d, 23MB, rápido |
| CSV parser | Manual | xlsx library | Lida com aspas, multi-linha, encoding |
| Encoding | UTF-8 direto | iconv-lite Latin-1 | CSV da ANVISA é ISO-8859-1 |
| CSS | styled-components | Tailwind v4 | Build time, sem runtime |
| Auth | NextAuth v5 | Credentials provider | Simples para admin único |
| Porta | 3000 (padrão) | 11006 | Evita conflito com outras apps |

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root user (UID 1001)
- **Rede**: bridge isolada `/16`
- **HTTP**: security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, etc.)
- **Rate Limit**: 60 req/min por IP nas rotas `/api/*`
- **Body Size**: limite de 10MB para server actions
- **Prisma**: módulo não exposto ao cliente (Edge Runtime não o carrega)
