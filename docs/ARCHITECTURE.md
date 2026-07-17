# Arquitetura

## Visão Geral

Unificando Med é uma aplicação Next.js 16 (App Router) com PostgreSQL que consome dados abertos da ANVISA para fornecer consulta inteligente de medicamentos intercambiáveis brasileiros.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Navegador   │────▶│  Next.js 16  │────▶│ PostgreSQL  │
│ (Tailwind v4)│     │ (App Router) │     │   (Prisma)  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Xenova/TF   │
                    │ (Embeddings) │
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
│   ├── schema.prisma      # Modelo de dados (Medicine, Price, User)
│   ├── migrations/        # Migrations versionadas
│   ├── seed.ts            # Seed automático da ANVISA
│   └── import-prices.ts   # Import de preços CMED
├── scripts/
│   └── generate-embeddings.ts  # Geração de embeddings IA
├── public/
│   ├── embeddings.bin     # Embeddings pré-computados
│   └── embeddings-header.json
├── src/
│   ├── app/               # App Router (páginas + API)
│   │   ├── page.tsx       # Home (busca + tabela)
│   │   ├── medicamento/[id]/
│   │   ├── referencias/
│   │   ├── atc/
│   │   ├── dashboard/
│   │   ├── compare/
│   │   ├── admin/
│   │   └── api/
│   │       ├── medicines/  # API REST pública
│   │       └── health/     # Health check
│   ├── components/
│   │   ├── layout/         # Header, Footer
│   │   ├── ui/             # Button, Badge, Card, Input, Skeleton
│   │   └── medicines/      # SearchForm, MedicineTable, SemanticSearch, CompareView
│   ├── lib/
│   │   ├── actions/        # Server Actions
│   │   │   ├── admin.ts    # syncWithAnvisa, getImportInfo
│   │   │   ├── search.ts   # searchMedicines, getDashboardStats
│   │   │   ├── export-action.ts
│   │   │   ├── compare.ts
│   │   │   ├── references.ts
│   │   │   ├── atc.ts
│   │   │   ├── prices.ts
│   │   │   └── semantic-search.ts  # IA local
│   │   ├── pdf-parser.ts
│   │   └── prisma.ts
│   ├── types/              # Interfaces TypeScript
│   └── middleware.ts       # Autenticação + Rate Limit
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # App + PostgreSQL
└── .env.example
```

## Fluxo de Dados

### Importação
1. Usuário admin clica "Sincronizar com ANVISA" ou via cron
2. Servidor faz HEAD no CSV remoto → verifica `Last-Modified`
3. Se alterado: baixa CSV → `iconv` (Latin-1 → UTF-8) → `xlsx` (parse) → Prisma `createMany`
4. Preços CMED: mesmo fluxo com `TA_PRECOS_MEDICAMENTOS.csv`

### Busca Semântica
1. One-time: `scripts/generate-embeddings.ts` gera embeddings 384d com all-MiniLM-L6-v2
2. Server action `semanticSearch()` carrega modelo + embeddings em memória
3. Usuário digita → query embedded → cosine similarity com 32k embeddings → top 20 resultados

### API REST
- GET `/api/medicines` com paginação, filtros, formato CSV
- GET `/api/health` com status do banco

## Decisões Técnicas

| Decisão | Alternativa | Escolha | Motivo |
|---------|-------------|---------|--------|
| IA local vs OpenAI | API paga | Xenova Transformers | Zero custo, sem dependência externa |
| CSV parser | Manual | xlsx library | Lida com aspas e multi-linha |
| Encoding | UTF-8 direto | iconv-lite Latin-1 | CSV da ANVISA é ISO-8859-1 |
| CSS | styled-components | Tailwind v4 | Build time, sem runtime |
| Auth | NextAuth v5 | Credentials provider | Simples para admin único |

## Segurança

- **Docker**: read-only rootfs, no-new-privileges, cap_drop ALL, non-root user
- **HTTP**: security headers (X-Frame-Options, CSP, etc.)
- **Rate Limit**: 60 req/min por IP nas rotas `/api/*`
- **Autenticação**: NextAuth protege `/admin/*`
- **Embeddings**: modelo ONNX roda server-side (não exposto ao cliente)
