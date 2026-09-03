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
│   ├── migrations/                # 15 migrations versionadas
│   └── seed.ts                    # Importa CSV ANVISA (medicamentos) + admin
├── scripts/
│   ├── generate-search-index.ts   # Gera embeddings pgvector 768d (multilingual-e5-base), incremental
│   ├── reindex-embeddings.ts      # Re-indexa TODOS os embeddings (forçado)
│   ├── generate-tsvector.ts       # Popula a coluna regular tsvector (fonte autoritativa)
│   ├── sync-farmacia-popular.ts   # Sincroniza PDF da Farmácia Popular
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
│   │   ├── page.tsx               # Home (busca semântica + autocomplete)
│   │   ├── loading.tsx            # Loading state global (skeleton realista)
│   │   ├── not-found.tsx          # 404 customizada
│   │   ├── sitemap.ts             # Sitemap dinâmico (~32k+ URLs)
│   │   ├── robots.ts              # Configuração de indexação
│   │   ├── opengraph-image.tsx    # OG Image gerada dinamicamente
│   │   ├── medicamento/[id]/      # Detalhes + JSON-LD + breadcrumbs + bula + gráfico preços + similares
│   │   ├── referencias/           # Lista (paginação, A-Z, ordenação) + detalhe de referência
│   │   ├── atc/                   # Árvore ATC (busca + autocomplete + expandir/recolher)
│   │   ├── atc/[code]/            # Medicamentos por código (paginação, breadcrumbs, mobile cards)
│   │   ├── detentor/[cnpj]/       # Todos medicamentos de uma empresa (cards mobile + resumo)
│   │   ├── dashboard/             # Stats + timeline por ano
│   │   ├── compare/               # Comparação lado a lado
│   │   ├── sobre/                 # Sobre o projeto
│   │   ├── admin/
│   │   │   ├── (protected)/       # Layout que exige sessão (redirect p/ login)
│   │   │   ├── login/             # Login do administrador (rate limit 10/min)
│   │   │   ├── import/            # Sincronização ANVISA + Preços + Farmácia Popular
│   │   │   ├── medicamentos/      # CRUD de medicamentos (admin)
│   │   │   ├── medicamentos/[id]/ # Edição individual
│   │   │   ├── search-feedback/   # Visualização de feedback de busca
│   │   │   └── search-analytics/  # Analytics das buscas (search_logs)
│   │   └── api/
│   │       ├── medicines/         # API REST pública (JSON/CSV, rate limit 60/min)
│   │       ├── autocomplete/      # Sugestões trigram (rate limit 120/min)
│   │       ├── search-feedback/   # POST feedback (20/min) + GET stats (admin)
│   │       ├── search-analytics/  # GET analytics (admin)
│   │       ├── auth/[...nextauth] # NextAuth v5 (Credentials)
│   │       └── health/            # Health check
│   ├── components/
│   │   ├── layout/                # Header (active link), Footer
│   │   ├── ui/                    # Badge, Button, Card, Input, Pagination, Skeleton,
│   │   │                          # Tooltip, Toast, Breadcrumbs, StatusPill, ClipboardButton,
│   │   │                          # FavoriteButton, PdfDownloadButton, ScrollToTop,
│   │   │                          # ConsoleCredits, ErrorBoundary, BarChart
│   │   ├── dashboard/             # DashboardFilters, FilterBar, StatCards, ChartsSection
│   │   ├── admin/                 # SyncCard, ImportStats, PriceStats, ConfirmModal, SyncLogList
│   │   └── medicines/             # SearchForm, AutocompleteField, SemanticSearch, MedicineTable,
│   │                              # MedicineInfoCard, SimilarSection, PriceSection, PriceChart,
│   │                              # CompareView, CompareTable, CompareSearch, ExportButton,
│   │                              # StatusFilter, ActionBar, HolderContent, ReferenceSearch,
│   │                              # SimilarMedicinesList, AtcTree, AtcCodeContent, ViewToggle,
│   │                              # SemanticResultsTable, SearchResultsCards, RecentSearches
│   ├── hooks/                     # use-favorites, use-recent-searches, use-debounced-search
│   ├── lib/
│   │   ├── actions/               # 17 server actions
│   │   │   ├── search.ts                    # searchMedicines, getDashboardStats, searchAutocomplete, countMedicines
│   │   │   ├── semantic-search.ts           # hybridSearch (IA local, RRF 3 vias), classificação
│   │   │   ├── keyword-search.ts            # Busca tsvector + FTS
│   │   │   ├── trigram-search.ts            # Busca trigram (pg_trgm)
│   │   │   ├── admin.ts                     # syncWithAnvisa, getImportInfo
│   │   │   ├── prices.ts                    # syncPrices
│   │   │   ├── embeddings.ts                # Geração de embeddings (batch 50)
│   │   │   ├── compare.ts                   # Comparação lado a lado
│   │   │   ├── references.ts                # Referências
│   │   │   ├── atc.ts                       # Árvore ATC
│   │   │   ├── export-action.ts             # CSV + Excel (xlsx)
│   │   │   ├── pdf-report.ts                # PDF (pdfmake)
│   │   │   ├── search-feedback.ts           # CRUD de feedback + applyScoreAdjustments
│   │   │   ├── farmacia-popular.ts          # Parse + match Farmácia Popular
│   │   │   ├── farmacia-popular-ativos.ts   # Ativos da Farmácia Popular
│   │   │   ├── medicines-admin.ts           # CRUD admin de medicamentos
│   │   │   └── medicine-detail.ts           # Detalhes do medicamento
│   │   ├── dictionaries/
│   │   │   ├── atc-codes.ts
│   │   │   ├── pharmaceutical-forms.ts
│   │   │   ├── prescription-types.ts
│   │   │   ├── synonyms.ts                  # SYNONYM_MAP consolidado
│   │   │   ├── therapeutic-classes.ts
│   │   │   └── therapeutic-class-indications.ts
│   │   ├── config.ts              # Configurações centralizadas (SITE, SEARCH, EMBEDDING, ANVISA)
│   │   ├── constants.ts           # MEDICINE_LIMITS etc.
│   │   ├── rate-limit.ts          # Rate limiter in-memory (por IP, por escopo)
│   │   ├── auth-guard.ts          # withAuth, withAuthReturn, withAdmin, withAdminReturn, isAdmin
│   │   ├── auth.config.ts         # Config NextAuth (signIn, maxAge, cookies)
│   │   ├── search-preprocessor.ts # classifyQuery, refineLowConfidenceClassification
│   │   ├── format.ts              # Normalização de texto
│   │   ├── text-utils.ts          # Utilitários de texto (normalizeQuery etc.)
│   │   ├── build-where.ts         # Construção de filtros Prisma
│   │   ├── query-parser.ts        # Parse de query
│   │   ├── keyword-utils.ts       # Sinônimos e expansão
│   │   ├── search-relevance.ts    # Cálculo de relevância (honestScore)
│   │   ├── score-adjustments.ts   # Ajustes de score por feedback
│   │   ├── embeddings-generator.ts # Geração batch de embeddings
│   │   ├── csv-utils.ts           # Escape CSV
│   │   ├── safe-json-ld.ts        # JSON-LD sanitizado
│   │   ├── pdf-parser.ts          # Parse de PDF
│   │   ├── theme-provider.tsx     # Dark mode context
│   │   ├── prisma.ts              # PrismaClient singleton
│   │   └── hooks/use-medicine-search.ts  # Busca com URL search params
│   ├── types/                     # index, medicine, next-auth.d.ts, pdf-parse.d.ts, pdfmake.d.ts
│   ├── auth.ts                    # Instância NextAuth v5
│   ├── proxy.ts                   # Rate limit do login (POST /admin/login, 10/min)
│   └── generated/prisma/          # Cliente Prisma gerado
├── tests/                         # Testes Vitest (api, components, lib/actions, lib)
├── prisma.config.ts
├── vitest.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── docker-entrypoint.sh
├── Dockerfile                     # Multi-stage (node:22-slim, non-root)
├── docker-compose.yml             # App + PostgreSQL (healthcheck, limites)
├── .env.example
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── BUSINESS_RULES.md
    ├── CRON.md
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
7. No Docker, a sequência completa é orquestrada pelo `docker-entrypoint.sh` quando o banco está vazio

### Busca Híbrida (3 fontes + RRF)
1. `npm run search-index` → `Xenova/multilingual-e5-base` (768d) → embeddings no PostgreSQL (pgvector, índice HNSW)
2. `npm run tsvector` → coluna `search_document` tsvector (regular) + índice GIN, stemming pt-br + sinônimos
3. pg_trgm → índice GIN trigram para keyword/autocomplete fuzzy
4. `hybridSearch` orquestra as 3 fontes em paralelo (topK × 5):
   - **Semântica**: `1 - (embedding <=> query_vector)` com cosine; `SET LOCAL ivfflat.probes` (best-effort); semantic gate
   - **Keyword**: `ts_rank(search_document, to_tsquery('portuguese', ...))` com expansão de sinônimos
   - **Trigram**: `GREATEST(similarity(tradeName), similarity(activeIngredient))` com o operador `%`
5. **RRF fusion** combina os 3 rankings:
   ```
   RRF(d) = Σ peso / (k + posição)
   k = 60 | semântica 0.40 | keyword 0.35 | trigram 0.25
   ```
6. Pós-processamento: penalidade de falso positivo por substring, boost por match de nome, verificação por keyword, penalidade de falta de suporte, ajustes por feedback
7. Fallbacks: keyword+trigram (sem semântica) e semântica pura
8. `logSearch` registra a busca em `search_logs` (analytics)

### Classificação de Query
- `classifyQuery` (heurística, `search-preprocessor.ts`): identifica frases de condição ("remédio para"), formas farmacêuticas, classes terapêuticas e nomes de medicamento (sufixos: -lina, -zepam, -prazol, -profeno, etc.)
- `classifyByEmbedding`: compara o embedding da query com centróides (amostra de nomes reais de medicamentos do banco vs. indicações/sinônimos)
- Somente reclassifica o fallback genérico quando a confiança ≤ 0.4

### SearchFeedback (Feedback Loop)
1. Usuário interage com resultados (clica em "útil" / "não útil")
2. POST → `/api/search-feedback` (rate limit 20/min) → tabela `search_feedback`
3. `score-adjustments.ts` consulta feedback agregado por medicamento
4. Ajusta score no re-ranking: feedback positivo aumenta rank, negativo reduz
5. Admin visualiza feedback em `/admin/search-feedback`

### Analytics de Busca
1. `logSearch` grava `query, results_count, top_score, query_type, response_time_ms` em `search_logs`
2. `/api/search-analytics` (admin) expõe top queries, queries sem resultado, performance (avg/p95), total 7 dias e distribuição por tipo
3. Admin visualiza em `/admin/search-analytics`

### Farmácia Popular
1. PDF do Ministério da Saúde é baixado
2. `scripts/sync-farmacia-popular.ts` orquestra a sincronização
3. `pdf-parser.ts` extrai tabelas do PDF
4. `lib/actions/farmacia-popular.ts` faz matching por `activeIngredient`
5. Dados armazenados: medicamento, apresentação, preço máximo, uf
6. Exibido no detalhe do medicamento como badge "Farmácia Popular"

### Geração de Embeddings
1. `scripts/generate-search-index.ts` processa em lotes de 50 medicamentos (DB batch 100, retry 3, delay 100ms)
2. Apenas medicamentos sem embedding (`WHERE embedding IS NULL`)
3. `Xenova/multilingual-e5-base` via Xenova Transformers (server-side, 100% local)
4. Texto com prefixo `passage:` + campos enriquecidos (forma farmacêutica e ATC resolvidos por dicionários)
5. Armazena vetor 768d na coluna `embedding` (pgvector)
6. `scripts/reindex-embeddings.ts` força a regeneração completa (troca de modelo)

### Geração de PDF
1. Botão "📥 BAIXAR PDF" na página de detalhes do medicamento
2. Server action `generateMedicinePdf()` usa pdfmake (engine vfs_fonts)
3. PDF inclui: cabeçalho com marca, informações do medicamento, medicamento de referência, tabela de preços CMED, rodapé com data e fonte
4. `pdfmake` com `pdfkit` como engine de renderização (serverExternalPackages)

### Exportação (CSV/Excel)
1. Botão "Exportar" nos resultados de busca ou dashboard
2. `lib/actions/export-action.ts` gera CSV ou Excel (xlsx library)
3. Suporta filtros ativos (detentor, classe, preço)
4. Download via Response (Content-Disposition: attachment)

### Otimizações de SEO
1. `generateMetadata()` em cada página de detalhe → title + description + Open Graph
2. JSON-LD (Schema.org/MedicalDrug) no detalhe (sanitizado via `safe-json-ld.ts`)
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
| Modelo de embedding | USE, BERT | multilingual-e5-base | 768 dims, multi-língua, melhor recall que e5-small |
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
| Rate limit | Redis | In-memory (Map) | Suficiente para instância única; migrar p/ Redis se multi-instância |

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root user (UID 1001)
- **Rede**: bridge isolada `/16`
- **HTTP**: security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP via next.config.ts)
- **CSP**: Content-Security-Policy no next.config.ts — fontes self-hosted (next/font), sem CDN de fontes
- **Rate limit interno**: `src/lib/rate-limit.ts` (in-memory Map, janela 60s) — escopos: medicines-api 60/min, autocomplete 120/min, search-feedback POST 20/min
- **Rate limit login**: `src/proxy.ts` — POST /admin/login 10/min
- **Auth**: páginas `/admin/(protected)/` exigem sessão (redirect p/ login); actions de admin usam withAdmin/withAdminReturn; `/admin/import` tem callback authorized; rotas `/api/search-analytics` e GET `/api/search-feedback` exigem role ADMIN
- **Body Size**: limite de 10MB para server actions
- **Prisma**: módulo não exposto ao cliente (Edge Runtime não o carrega)