# Arquitetura

## Visão Geral

Med Unificando é uma aplicação Next.js 16 (App Router) com PostgreSQL que consome dados abertos da ANVISA e do Ministério da Saúde para fornecer consulta inteligente de medicamentos intercambiáveis brasileiros.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Navegador   │────▶│  Next.js 16  │────▶│ PostgreSQL  │
│ (Tailwind v4)│     │ (App Router) │     │   (Prisma)  │
│   (PWA)     │     │  :11006      │     │   :5432     │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                     │
                    ┌──────▼───────┐    ┌────────▼────────┐
                    │  Xenova/TF   │    │  SearchFeedback  │
                    │ (Embeddings) │    │   (score ajust)  │
                    │ (LLM local)  │    └─────────────────┘
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐     ┌─────────────────┐
                    │  Dados       │     │  Farmácia       │
                    │  Abertos     │     │  Popular (PDF)  │
                    │  ANVISA/CMED │     │  MS             │
                    └──────────────┘     └─────────────────┘
```

## Estrutura de Pastas

```
med-unificando/
├── prisma/
│   ├── schema.prisma              # Medicine, Price, User, SyncLog, SearchFeedback
│   ├── migrations/                # Migrations versionadas
│   ├── seed.ts                    # Importa CSV ANVISA (medicamentos)
│   └── import-prices.ts           # Importa CSV CMED (preços)
├── scripts/
│   ├── generate-search-index.ts   # Gera embeddings pgvector 384d (multilingual-e5-small)
│   ├── generate-tsvector.ts       # Gera coluna tsvector para busca keyword
│   ├── sync-farmacia-popular.ts   # Sincroniza PDF da Farmácia Popular via S3/external
│   ├── backfill-indications.ts    # Preenche indicações terapêuticas
│   ├── backfill-therapeutic-class.ts  # Preenche classe terapêutica do CSV DADOS_ABERTOS
│   ├── add-active-ingredients.ts  # Adiciona princípios ativos normalizados
│   ├── diagnose-search.ts         # Diagnóstico de performance da busca
│   ├── test-hybrid-search.ts      # Teste de busca híbrida (RRF)
│   ├── test-hybrid.ts             # Teste alternativo de busca híbrida
│   ├── test-keyword.ts            # Teste de busca keyword isolada
│   ├── test-tsvector.ts           # Teste de busca tsvector
│   ├── run-search-tests.ts        # Runner de bateria de testes de busca
│   └── analyze-thresholds.ts      # Análise de thresholds de relevância
├── public/
│   └── manifest.json              # PWA manifest
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home (busca textual + semântica)
│   │   ├── loading.tsx            # Loading state global
│   │   ├── not-found.tsx          # 404 customizada
│   │   ├── sitemap.ts             # Sitemap dinâmico (~32k+ URLs)
│   │   ├── robots.ts              # Configuração de indexação
│   │   ├── opengraph-image.tsx    # OG Image gerada dinamicamente
│   │   ├── medicamento/[id]/      # Detalhes + JSON-LD + breadcrumbs + bula + gráfico preços + similares com navegação
│   │   ├── referencias/           # Lista (paginação, A-Z, ordenação) + detalhe de referência
│   │   ├── atc/                   # Árvore ATC (busca + autocomplete + expandir/recolher)
│   │   ├── atc/[code]/            # Medicamentos por código (paginação, breadcrumbs, mobile cards)
│   │   ├── detentor/[cnpj]/       # Todos medicamentos de uma empresa (cards mobile + resumo)
│   │   ├── dashboard/             # Stats + timeline por ano
│   │   ├── compare/               # Comparação lado a lado
│   │   ├── sobre/                 # Sobre o projeto
│   │   ├── admin/
│   │   │   ├── page.tsx           # Login + painel de importação
│   │   │   ├── medicamentos/      # CRUD de medicamentos (admin)
│   │   │   └── medicamentos/[id]/ # Edição individual
│   │   ├── admin/search-feedback/ # Visualização de feedback de busca
│   │   └── api/
│   │       ├── medicines/         # API REST pública (JSON/CSV)
│   │       ├── search-feedback/   # POST /api/search-feedback (armazena feedback)
│   │       ├── auth/[...nextauth] # NextAuth v5 (Credentials)
│   │       └── health/            # Health check
│   ├── components/
│   │   ├── layout/                # Header, Footer
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── status-pill.tsx
│   │   │   ├── clipboard-button.tsx
│   │   │   ├── favorite-button.tsx
│   │   │   ├── pdf-download-button.tsx
│   │   │   ├── scroll-to-top.tsx
│   │   │   ├── console-credits.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── bar-chart.tsx
│   │   ├── dashboard/
│   │   │   ├── dashboard-filters.tsx
│   │   │   ├── filter-bar.tsx
│   │   │   ├── stat-cards.tsx
│   │   │   └── charts-section.tsx
│   │   ├── admin/
│   │   │   ├── sync-card.tsx
│   │   │   ├── import-stats.tsx
│   │   │   ├── price-stats.tsx
│   │   │   ├── confirm-modal.tsx
│   │   │   └── sync-log-list.tsx
│   │   └── medicines/
│   │       ├── search-form.tsx              # Filtros de busca (query + 6 campos server-side)
│   │       ├── autocomplete-field.tsx       # Autocomplete server-side com teclado
│   │       ├── semantic-search.tsx          # Busca por descrição com IA
│   │       ├── medicine-table.tsx           # Tabela + mobile cards + selecionar todos
│   │       ├── medicine-info-card.tsx       # Card de informações (17 campos + ver mais)
│   │       ├── similar-section.tsx          # Similares com navegação anterior/próximo
│   │       ├── price-section.tsx            # Preços CMED
│   │       ├── price-chart.tsx              # Gráfico de barras (recharts)
│   │       ├── compare-view.tsx             # Comparação
│   │       ├── compare-table.tsx            # Tabela comparativa com highlight de diferenças
│   │       ├── compare-search.tsx           # Busca com autocomplete + teclado
│   │       ├── export-button.tsx            # Exportação CSV/Excel
│   │       ├── status-filter.tsx            # Pills de situação (Ativo/Inativo)
│   │       ├── action-bar.tsx               # Ações contextuais
│   │       ├── holder-content.tsx           # Detentor (cards mobile + autocomplete)
│   │       ├── reference-search.tsx         # Referências (paginação + A-Z + ordenação)
│   │       ├── similar-medicines-list.tsx   # Lista de similares com paginação
│   │       ├── atc-tree.tsx                 # Árvore ATC (busca + autocomplete)
│   │       └── atc-code-content.tsx         # Medicamentos ATC (paginação + breadcrumbs)
│   ├── hooks/
│   │   ├── use-favorites.ts
│   │   ├── use-recent-searches.ts
│   │   ├── use-debounced-search.ts
│   │   └── use-medicine-search.ts
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── search.ts                       # searchMedicines, getDashboardStats, searchAutocomplete, countMedicines
│   │   │   ├── semantic-search.ts              # IA local server-side (Xenova)
│   │   │   ├── keyword-search.ts               # Busca tsvector + FTS
│   │   │   ├── admin.ts                        # syncWithAnvisa, getImportInfo
│   │   │   ├── prices.ts                       # syncPrices
│   │   │   ├── embeddings.ts                   # Geração de embeddings (batch 50)
│   │   │   ├── compare.ts                      # Comparação lado a lado
│   │   │   ├── references.ts                   # Referências
│   │   │   ├── atc.ts                          # Árvore ATC
│   │   │   ├── export-action.ts                # CSV + Excel (xlsx)
│   │   │   ├── pdf-report.ts                   # PDF (pdfmake)
│   │   │   ├── search-feedback.ts              # CRUD de feedback de busca
│   │   │   ├── farmacia-popular.ts             # Parse + match Farmácia Popular
│   │   │   ├── farmacia-popular-ativos.ts      # Ativos da Farmácia Popular
│   │   │   └── medicines-admin.ts              # CRUD admin de medicamentos
│   │   ├── dictionaries/
│   │   │   ├── atc-codes.ts
│   │   │   ├── pharmaceutical-forms.ts
│   │   │   ├── prescription-types.ts
│   │   │   ├── therapeutic-classes.ts
│   │   │   └── therapeutic-class-indications.ts
│   │   ├── format.ts
│   │   ├── build-where.ts
│   │   ├── query-parser.ts
│   │   ├── keyword-utils.ts
│   │   ├── search-relevance.ts
│   │   ├── score-adjustments.ts               # Ajusta scores baseado em feedback
│   │   ├── embeddings-generator.ts
│   │   ├── pdf-parser.ts
│   │   ├── theme-provider.tsx
│   │   └── prisma.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── medicine.ts
│   │   ├── next-auth.d.ts
│   │   ├── pdf-parse.d.ts
│   │   └── pdfmake.d.ts
│   ├── auth.ts                    # Configuração NextAuth v5
│   ├── proxy.ts                   # Rate limiter middleware (upstash/next)
│   └── middleware.ts              # Segurança + rate limit
├── tests/                         # Testes (Vitest)
├── prisma.config.ts
├── vitest.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── docker-entrypoint.sh
├── Dockerfile                     # Multi-stage (node:22-alpine, non-root)
├── docker-compose.yml             # App + PostgreSQL (healthcheck, limites)
├── .env.example
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── BUSINESS_RULES.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    ├── DESIGN_SYSTEM.md
    ├── DEVELOPMENT.md
    ├── SECURITY.md
    └── USER_STORIES.md
```

## Fluxo de Dados

### Importação
1. Usuário admin clica "Sincronizar" ou via script `npm run seed`
2. Servidor faz HEAD no CSV remoto → verifica `Last-Modified`
3. Se alterado: baixa CSV → `iconv` (Latin-1 → UTF-8) → `xlsx` (parse) → Prisma `createMany`
4. Extrai `therapeuticClass` do campo `CLASSE_TERAPEUTICA` do CSV DADOS_ABERTOS_MEDICAMENTOS
5. Registra log em `SyncLog` (type, count, status)
6. Preços CMED: mesmo fluxo via `TA_PRECOS_MEDICAMENTOS.csv`

### Busca Semântica (Híbrida com RRF)
1. `npm run generate-search-index` → multilingual-e5-small (384d) → embeddings no PostgreSQL (pgvector)
2. tsvector GIN index para busca keyword rápida com stemming pt-br + sinônimos
3. pgvector IVFFlat index para busca semântica O(log n) via cosine distance
4. RRF (Reciprocal Rank Fusion) combina os dois rankings:
   - `RRF(d) = 1/(60 + rank_keyword(d)) + 1/(60 + rank_semantic(d))`
   - Peso 60 (k) controlável via `analyze-thresholds.ts`
5. Score adjustments (`score-adjustments.ts`) aplicam re-ranking baseado em:
   - Feedback explícito dos usuários (SearchFeedback)
   - Popularidade (contagem de visualizações)
   - Precisão do match (exato vs parcial)
6. Texto do embedding inclui: nome, princípio ativo, categoria, sinônimos, indicações

### SearchFeedback (Feedback Loop)
1. Usuário interage com resultados (clica em "útil" / "não útil")
2. POST → `/api/search-feedback/route.ts` → tabela `SearchFeedback`
3. `score-adjustments.ts` consulta feedback agregado por medicamento
4. Ajusta score no re-ranking: feedback positivo aumenta rank, negativo reduz
5. Admin visualiza feedback em `/admin/search-feedback`

### Farmácia Popular
1. PDF do Ministério da Saúde é baixado (ou recebido via S3)
2. `scripts/sync-farmacia-popular.ts` orquestra a sincronização
3. `pdf-parser.ts` extrai tabelas do PDF
4. `lib/actions/farmacia-popular.ts` faz matching por `activeIngredient`
5. Dados armazenados: medicamento, apresentação, preço máximo, uf
6. Exibido no detalhe do medicamento como badge "Farmácia Popular"

### Geração de Embeddings
1. `lib/actions/embeddings.ts` processa em lotes de 50 medicamentos
2. Apenas medicamentos sem embedding ou com conteúdo alterado
3. `multilingual-e5-small` via Xenova Transformers (server-side)
4. Armazena vetor 384d na coluna `embedding` (pgvector)

### Geração de PDF
1. Botão "📥 BAIXAR PDF" na página de detalhes do medicamento
2. Server action `generateMedicinePdf()` usa pdfmake (engine vfs_fonts)
3. PDF inclui: cabeçalho com marca, informações do medicamento, medicamento de referência, tabela de preços CMED, rodapé com data e fonte
4. `pdfmake` com `pdfkit` como engine de renderização (serverExternalPackages)

### Exportação (CSV/Excel)
1. Botão "Exportar" nos resultados de busca ou dashboard
2. `lib/actions/export-action.ts` gera CSV ou Excel (xlsx library)
3 Suporta filtros ativos (detentor, classe, preço)
4. Download via Response (Content-Disposition: attachment)

### Otimizações de SEO
1. `generateMetadata()` em cada página de detalhe → title + description + Open Graph
2. JSON-LD (Schema.org/MedicalDrug) no detalhe
3. `sitemap.ts` → 32.585+ URLs
4. `robots.ts` → permite indexação, bloqueia /admin/ e /api/
5. `opengraph-image.tsx` → OG Image dinâmica por medicamento

### PWA
- `manifest.json` com display standalone
- Ícones 192x192 e 512x512
- Meta tag theme-color

## Decisões Técnicas

| Decisão | Alternativa | Escolha | Motivo |
|---------|-------------|---------|--------|
| IA local vs OpenAI | API paga | Xenova Transformers | Zero custo, sem dependência externa |
| Modelo de embedding | USE, BERT | multilingual-e5-small | 384d, 23MB, rápido, multi-língua |
| CSV parser | Manual | xlsx library | Lida com aspas, multi-linha, encoding |
| Encoding | UTF-8 direto | iconv-lite Latin-1 | CSV da ANVISA é ISO-8859-1 |
| CSS | styled-components | Tailwind v4 | Build time, sem runtime |
| Auth | NextAuth v5 | Credentials provider | Simples para admin único |
| Porta | 3000 (padrão) | 11006 | Evita conflito com outras apps |
| PDF | jspdf/pdfkit | pdfmake | PdfPrinter API, layout declarativo |
| Test runner | Jest | Vitest | Nativo ESM, mais rápido, compatível com Next |
| Export | csv-stringify | xlsx | Suporte nativo a Excel (.xlsx) |
| Feedback | Session/memória | PostgreSQL (SearchFeedback) | Persistente, auditável, queryável |
| Farmácia Popular | Manual OCR | pdf-parse + matching por activeIngredient | Custo zero, estrutura tabular previsível |

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root user (UID 1001)
- **Rede**: bridge isolada `/16`
- **HTTP**: security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP via next.config.ts)
- **CSP**: Content-Security-Policy configurado no `next.config.ts` (script-src, style-src, font-src restritos)
- **Rate Limit interno**: `src/proxy.ts` (Upstash/next) — middleware de rate limiter por IP nas rotas `/api/*`
- **Rate Limit externo**: middleware.ts — 60 req/min por IP nas rotas `/api/*`
- **Body Size**: limite de 10MB para server actions
- **Prisma**: módulo não exposto ao cliente (Edge Runtime não o carrega)
