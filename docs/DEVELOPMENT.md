# Desenvolvimento

## Setup

### Pré-requisitos
- Node.js 22+
- Docker Engine 24+
- NPM 10+

### Passos

```bash
# 1. Clone
git clone https://github.com/seu-usuario/unificando-med.git
cd unificando-med/medicamentos

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

# 8. Dev server
npm run dev
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server :11006 com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção :11006 |
| `npm run lint` | ESLint |
| `npm run seed` | Importar dados ANVISA |
| `npm run embeddings` | Gerar embeddings IA |
| `npm run migrate` | Aplicar migrations Prisma |
| `npm run generate` | Gerar cliente Prisma |
| `npm run docker:up` | `docker compose up -d` |
| `npm run docker:down` | `docker compose down` |
| `npm run docker:build` | `docker compose build --no-cache` |

## Estrutura de Arquivos

```
src/
├── app/             # App Router (cada pasta = uma rota)
│   ├── page.tsx     # Home
│   ├── medicamento/[id]/
│   ├── referencias/
│   ├── atc/
│   ├── detentor/[cnpj]/
│   ├── dashboard/
│   ├── compare/
│   ├── admin/
│   └── api/
├── components/
│   ├── layout/      # Header, Footer
│   ├── ui/          # Button, Badge, Card, Input, Skeleton, Breadcrumbs, ScrollToTop, ClipboardButton
│   └── medicines/   # SearchForm, MedicineTable, SemanticSearch, CompareView, ExportButton
├── lib/
│   ├── actions/     # Server Actions
│   └── prisma.ts    # Prisma client singleton
└── types/           # TypeScript interfaces
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

Após importar novos dados, regenerar embeddings:

```bash
npm run embeddings
```

Isso atualiza `public/embeddings.bin` com os embeddings de todos os medicamentos
(incluindo sinônimos e indicações no texto de busca).

## Busca Semântica

Usa `@xenova/transformers` com o modelo `all-MiniLM-L6-v2` (384 dimensões).

O modelo é baixado automaticamente na primeira execução e cacheado em `~/.cache/xenova/`.

O fluxo:
1. `scripts/generate-embeddings.ts` → gera `public/embeddings.bin` (one-time)
2. Server action `semanticSearch()` → carrega modelo + embeddings
3. Query do usuário → embedded → cosine similarity → top 20 resultados

O texto usado para gerar cada embedding inclui:
`nome | princípio ativo | categoria | detentor | forma farmacêutica | concentração | sinônimos | indicações | situação | registro`

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
