# Desenvolvimento

## Setup

### Pré-requisitos
- Node.js 22+
- Docker Engine 24+
- NPM 10+

### Passos

```bash
# 1. Clone
git clone git@github.com:renatojuniordw/med-unificando.git
cd med-unificando

# 2. Configure
cp .env.example .env

# 3. Banco
docker compose up -d db

# 4. Dependências
npm install

# 5. Prisma
npx prisma generate
npx prisma migrate deploy

# 6. Seed (importa dados da ANVISA)
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts

# 7. Embeddings para busca semântica
npx tsx scripts/generate-embeddings.ts

# 8. Sincronizar Farmácia Popular
npm run farmacia-popular

# 9. Dev server
npm run dev
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server :11006 com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção :11006 |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Vitest coverage |
| `npm run seed` | Importar dados ANVISA |
| `npm run migrate` | Aplicar migrations Prisma |
| `npm run generate` | Gerar cliente Prisma |
| `npm run search-index` | Gerar embeddings pgvector |
| `npm run tsvector` | Gerar tsvector search documents |
| `npm run backfill-indications` | Backfill indicações terapêuticas |
| `npm run farmacia-popular` | Sincronizar Farmácia Popular |
| `npm run docker:up` | docker compose up -d |
| `npm run docker:down` | docker compose down |
| `npm run docker:build` | docker compose build --no-cache |

## Estrutura de Arquivos

```
src/
├── app/             # App Router
│   ├── page.tsx     # Home (busca semântica)
│   ├── buscar-avancado/  # Busca textual avançada
│   ├── medicamento/[id]/ # Detalhes + PDF + preços
│   ├── referencias/      # Lista + detalhe de referência
│   ├── atc/              # Árvore ATC
│   ├── detentor/[cnpj]/  # Medicamentos por empresa
│   ├── dashboard/        # Estatísticas
│   ├── compare/          # Comparação
│   ├── sobre/            # Sobre o projeto
│   ├── admin/            # Login, import, medicamentos, feedback
│   └── api/              # medicines, health, search-feedback, auth
├── components/
│   ├── admin/       # SyncCard, ImportStats, PriceStats, ConfirmModal, SyncLogList
│   ├── dashboard/   # DashboardFilters, FilterBar, StatCards, ChartsSection
│   ├── layout/      # Header, Footer
│   ├── medicines/   # 22 componentes (SearchForm, MedicineTable, SemanticSearch, etc.)
│   └── ui/          # 17 primitivos (Button, Badge, Card, Input, Toast, etc.)
├── hooks/           # use-favorites, use-recent-searches, use-debounced-search, use-medicine-search
├── lib/
│   ├── actions/     # 15 server actions
│   ├── dictionaries/# ATC, formas farmacêuticas, tarjas, classes
│   ├── config.ts    # Configurações centralizadas
│   ├── constants.ts # Constantes nomeadas
│   ├── format.ts    # Normalização de texto
│   ├── build-where.ts # Construção de filtros Prisma
│   ├── query-parser.ts # Parse de query
│   ├── keyword-utils.ts # Sinônimos e expansão
│   ├── search-relevance.ts # Labels de relevância
│   ├── score-adjustments.ts # Ajustes por feedback
│   ├── embeddings-generator.ts # Geração batch de embeddings
│   ├── pdf-parser.ts # Parse de PDF
│   └── theme-provider.tsx # Dark mode context
├── types/           # TypeScript interfaces
├── auth.ts          # NextAuth config
└── proxy.ts         # Rate limiter middleware
```

## Convenções

### Código
- TypeScript estrito (`strict: true`)
- Server Components por padrão, Client Components quando necessário (`'use client'`)
- Server Actions para mutações de dados
- CSS com Tailwind v4 (utilitário, sem CSS modules)

### Organização
- `src/app/` — rotas (App Router)
- `src/components/` — componentes React
- `src/lib/` — lógica de negócio
- `src/lib/actions/` — server actions
- `src/types/` — tipos compartilhados

### Componentes UI
- `src/components/ui/` — genéricos, reutilizáveis
- `src/components/medicines/` — específicos do domínio
- Cada componente em seu próprio arquivo `.tsx`

### Commits
- Commits atômicos (uma mudança por commit)
- Mensagens em português ou inglês
- Prefixos: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## Modelo de Dados

Sempre que alterar `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name descricao
npx prisma generate
```

Nunca edite migrations já aplicadas — sempre crie novas.

## Geração de PDF

O PDF é gerado server-side com `pdfmake`. A action `generateMedicinePdf()` em
`src/lib/actions/pdf-report.ts` cria um documento com cabeçalho, grid de informações,
tabela de preços e rodapé.

O `pdfmake` está em `serverExternalPackages` no `next.config.ts` porque usa
módulos nativos do Node.js (pdfkit internamente).

```typescript
import PdfPrinter from 'pdfmake'
const printer = new PdfPrinter(fonts)
const doc = printer.createPdfKitDocument(docDefinition)
doc.pipe(res)
doc.end()
```

Após importar novos dados, regenerar embeddings:

```bash
npm run search-index
```

Isso atualiza os embeddings no banco de dados PostgreSQL (pgvector) com os medicamentos que ainda não possuem embedding.

## Busca Semântica

Usa `@xenova/transformers` com o modelo `multilingual-e5-small` (384 dimensões).

O modelo é baixado automaticamente na primeira execução e cacheado em `/tmp/.transformers-cache`.

O fluxo:
1. `npm run search-index` → gera embeddings no banco pgvector
2. Busca semântica: pgvector IVFFlat index (cosine distance) com **semantic gate** (score mínimo 0.80)
3. Busca keyword: tsvector + GIN index (stemming pt-br + sinônimos) com **keyword gate** fallback
4. **RRF fusion** (Reciprocal Rank Fusion) combina os dois rankings
5. **Score adjustments** baseados em feedback dos usuários
6. **Synonym expansion** com 35+ entradas

O texto usado para gerar cada embedding inclui:
`nome | princípio ativo | categoria | detentor | forma farmacêutica | concentração | sinônimos | indicações | situação | registro`

## Testes

```bash
npm run test           # Rodar testes
npm run test:watch     # Modo watch
npm run test:coverage  # Com cobertura
```

Testes estão em `tests/` usando Vitest + @testing-library/react + jsdom.

## Hooks Customizados

- `use-favorites` — Favoritos em localStorage (toggle, isFavorite)
- `use-recent-searches` — Últimas 5 buscas em localStorage
- `use-debounced-search` — Busca com debounce genérica
- `use-medicine-search` — URL search params → server data → pagination

## Encoding

Os CSVs da ANVISA estão em **Latin-1 (ISO-8859-1)**.

```typescript
// Correto
import iconv from 'iconv-lite'
const text = iconv.decode(buffer, 'latin1')

// ERRADO — corrompe acentos
const text = buffer.toString()
```

## SSL

O servidor da ANVISA (`dados.anvisa.gov.br`) usa certificado não verificado:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts
```

Em produção, o Dockerfile usa o CA bundle do Alpine sem necessidade de flags.

## Porta

O projeto roda na porta **11006** (configurada em `package.json` scripts).

```bash
npm run dev    # → http://localhost:11006
npm run start  # → http://localhost:11006
```
