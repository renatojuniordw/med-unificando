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

# 6. Seed
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts

# 7. Embeddings
npx tsx scripts/generate-embeddings.ts

# 8. Dev
npm run dev
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run seed` | Importar dados ANVISA |
| `npm run embeddings` | Gerar embeddings IA |
| `npm run migrate` | Aplicar migrations |
| `npm run generate` | Gerar cliente Prisma |
| `npm run docker:up` | Subir Docker |
| `npm run docker:down` | Parar Docker |
| `npm run docker:build` | Rebuild Docker |

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

### Commits
- Commits atômicos (uma mudança por commit)
- Mensagens em português ou inglês
- Prefixos sugeridos: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## Modelo de Dados

Sempre que alterar o schema.prisma:

```bash
npx prisma migrate dev --name descricao
npx prisma generate
```

Nunca edite migrations já aplicadas — crie novas.

## Busca Semântica

Após importar novos dados:

```bash
npm run embeddings
```

Isso regenera o arquivo `public/embeddings.bin` com os embeddings de todos os medicamentos.

A busca semântica usa `@xenova/transformers` com o modelo `all-MiniLM-L6-v2`. O modelo é baixado automaticamente na primeira execução e cacheado em `~/.cache/xenova/`.

## Encoding

Os CSVs da ANVISA estão em **Latin-1 (ISO-8859-1)**. Toda comunicação com os dados abertos deve usar `iconv-lite`:

```typescript
import iconv from 'iconv-lite'
const text = iconv.decode(buffer, 'latin1')
```

Nunca use `.toString()` direto em buffers baixados da ANVISA.

## SSL

O servidor da ANVISA (`dados.anvisa.gov.br`) usa certificado não verificado por algumas autoridades. Para desenvolvimento:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts
```

Em produção, o Dockerfile já usa o CA bundle do Alpine.
