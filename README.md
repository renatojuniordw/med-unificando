# Unificando Med

Consulta inteligente de medicamentos intercambiáveis da ANVISA com busca semântica por IA.

## Funcionalidades

- 🔍 **Busca textual** por referência, princípio ativo, nome comercial
- 🤖 **Busca semântica** com IA local (descreva o medicamento em linguagem natural)
- 📊 **Comparação** lado a lado de medicamentos
- 🏷️ **Explorar por referência** — veja todos os similares de um medicamento de referência
- 🔬 **Navegação ATC** — explore por classificação Anatômica/Terapêutica/Química
- 💰 **Preços CMED** — visualize preços máximos ao consumidor
- 📈 **Dashboard** com estatísticas da base
- 🔄 **Sincronização automática** com os dados abertos da ANVISA
- 📥 **Exportação** em CSV e Excel

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL 16 |
| ORM | Prisma 7 |
| Estilo | Tailwind CSS v4 (Neo-Brutalist) |
| Autenticação | NextAuth v5 |
| IA (embeddings) | Xenova Transformers (ONNX) |
| UI | Componentes próprios |
| Infra | Docker Compose |

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Acesse [http://localhost:11006](http://localhost:11006)

O seed dos dados é automático na primeira execução (via entrypoint). Para forçar:

```bash
docker compose exec app npm run seed
```

## Instalação Manual

```bash
# 1. Clone
git clone https://github.com/seu-usuario/unificando-med.git
cd unificando-med

# 2. Configure
cp .env.example .env
# Edite .env com suas credenciais

# 3. Banco de dados
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

## Portas

| Serviço | Porta |
|---------|-------|
| Aplicação | 11006 |
| PostgreSQL | 5432 |

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `AUTH_SECRET` | Chave secreta para JWT (gerar com `openssl rand -base64 32`) | Sim |
| `ADMIN_EMAIL` | Email do admin para login | Sim |
| `ADMIN_PASSWORD` | Senha do admin | Sim |

## Scripts

```bash
npm run dev         # Dev server na porta 11006
npm run build       # Build de produção
npm run start       # Servidor de produção na porta 11006
npm run seed        # Importar dados da ANVISA
npm run embeddings  # Gerar embeddings para busca semântica
npm run migrate     # Aplicar migrations Prisma
npm run generate    # Gerar cliente Prisma
npm run docker:up   # Docker Compose up
npm run lint        # ESLint
```

## API Pública

```bash
# Listar medicamentos
curl http://localhost:11006/api/medicines?page=1&pageSize=10

# Filtrar por categoria
curl "http://localhost:11006/api/medicines?category=Similar"

# Exportar CSV
curl "http://localhost:11006/api/medicines?format=csv"

# Health check
curl http://localhost:11006/api/health
```

## Fontes de Dados

- **Medicamentos**: [Dados Abertos ANVISA](https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV)
- **Preços**: [Tabela CMED](https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv)
- **Portal**: [dados.anvisa.gov.br](https://dados.anvisa.gov.br/dados/)

## Licença

MIT
