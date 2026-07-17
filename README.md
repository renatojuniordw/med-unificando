# Unificando Med

Consulta inteligente de medicamentos intercambiáveis da ANVISA com busca semântica por IA local.

## Funcionalidades

- 🔍 **Busca textual** por referência, princípio ativo, nome comercial e categoria
- 🤖 **Busca semântica** com IA local (descreva o medicamento em linguagem natural)
- 📊 **Comparação** lado a lado de medicamentos com destaque de diferenças
- 🏷️ **Explorar por referência** — veja todos os similares de um medicamento de referência
- 🔬 **Navegação ATC** — explore por classificação Anatômica/Terapêutica/Química (tree view + drill-down)
- 💰 **Preços CMED** — visualize preços máximos ao consumidor com gráfico de barras
- 🏢 **Página do detentor** — todos os medicamentos de uma empresa
- 📈 **Dashboard** com estatísticas, distribuição por categoria e timeline por ano
- 🔄 **Sincronização automática** com dados abertos ANVISA (com detecção de mudanças via Last-Modified)
- 📥 **Exportação** em CSV e Excel
- 📋 **Copiar registro** com um clique
- 📄 **Link para bula eletrônica** ANVISA
- 🧭 **Breadcrumbs** de navegação
- 📱 **PWA** — instalável como app no celular
- 🔗 **JSON-LD** + meta tags dinâmicas para SEO

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL 16 |
| ORM | Prisma 7 |
| Estilo | Tailwind CSS v4 (Neo-Brutalist) |
| Autenticação | NextAuth v5 |
| IA (embeddings) | Xenova Transformers (ONNX local) |
| IA (busca) | all-MiniLM-L6-v2 (384d) |
| Infra | Docker Compose + multi-stage build |

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Acesse [http://localhost:11006](http://localhost:11006)

```bash
# Forçar seed dos dados
docker compose exec app npm run seed
```

## Instalação Manual

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

# 8. Dev server
npm run dev
```

## Portas

| Serviço | Porta |
|---------|-------|
| Aplicação | 11006 |
| PostgreSQL | 5432 |

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `AUTH_SECRET` | Chave secreta JWT (`openssl rand -base64 32`) | Sim |
| `ADMIN_EMAIL` | Email do admin | Sim |
| `ADMIN_PASSWORD` | Senha do admin | Sim |

## Scripts

```bash
npm run dev         # Dev server :11006
npm run build       # Build produção
npm run start       # Start produção :11006
npm run seed        # Importar dados ANVISA
npm run embeddings  # Gerar embeddings
npm run migrate     # Aplicar migrations
npm run generate    # Gerar cliente Prisma
npm run lint        # ESLint
npm run docker:up   # Docker Compose up
npm run docker:down # Docker Compose down
```

## API Pública

```bash
# Listar medicamentos
curl http://localhost:11006/api/medicines?page=1&pageSize=10

# Filtrar por categoria + situação
curl "http://localhost:11006/api/medicines?category=Similar&status=Ativo"

# Exportar CSV
curl "http://localhost:11006/api/medicines?format=csv" -o medicamentos.csv

# Health check
curl http://localhost:11006/api/health
```

## Rotas da Aplicação

| Rota | Descrição |
|------|-----------|
| `/` | Busca textual + semântica |
| `/medicamento/[id]` | Detalhes com preços, similares, bula, gráfico |
| `/referencias` | Lista de medicamentos de referência |
| `/referencias/[name]` | Similares de uma referência |
| `/atc` | Navegação por árvore ATC |
| `/atc/[code]` | Medicamentos por código ATC |
| `/detentor/[cnpj]` | Todos medicamentos de um detentor |
| `/dashboard` | Estatísticas + timeline |
| `/compare` | Comparação lado a lado |
| `/admin/import` | Sincronização ANVISA + Preços |
| `/api/medicines` | API REST pública |
| `/api/health` | Health check |
| `/sitemap.xml` | Sitemap (32k+ URLs) |
| `/robots.txt` | Robots.txt |

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root user
- **HTTP**: security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **Rate Limit**: 60 req/min nas rotas `/api/*`
- **Auth**: proteção das rotas `/admin/*`

## Fontes de Dados

- **Medicamentos**: [Dados Abertos ANVISA](https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV)
- **Preços**: [Tabela CMED](https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv)
- **Portal**: [dados.anvisa.gov.br](https://dados.anvisa.gov.br/dados/)

## Licença

MIT
