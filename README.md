# Med Unificando

Consulta inteligente de medicamentos intercambiáveis da ANVISA com busca semântica por IA local.

> Projeto ofertado por [Unificando](https://unificando.com.br) | Desenvolvido por [Renato Bezerra](https://renatobezerra.com.br)

---

## Funcionalidades

- **Busca textual** por referência, princípio ativo, nome comercial e categoria
- **Busca semântica** com IA local — descreva o medicamento em linguagem natural
- **Comparação** lado a lado com destaque visual de diferenças
- **Explorar por referência** — veja todos os similares de um medicamento de referência
- **Navegação ATC** — explore por classificação Anatômica/Terapêutica/Química
- **Preços CMED** — visualize preços máximos ao consumidor com gráfico de barras
- **Página do detentor** — todos os medicamentos de uma empresa
- **Dashboard** com filtros interativos (ano, categoria, situação) e timeline
- **Exportação** em CSV e Excel (corretamente escaped)
- **Relatório PDF** do medicamento com identidade visual
- **Favoritos** — salve medicamentos de interesse
- **Buscas recentes** — acesso rápido às últimas consultas
- **Dark mode** — tema claro/escuro com persistência
- **Sincronização automática** com dados abertos ANVISA
- **PWA** — instalável como app no celular
- **JSON-LD** + meta tags dinâmicas para SEO
- **Console de credits** — informações do projeto no DevTools

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL 16 |
| ORM | Prisma 7 |
| Estilo | Tailwind CSS v4 |
| Autenticação | NextAuth v5 (beta) |
| IA (embeddings) | Xenova Transformers (ONNX local) |
| IA (busca) | all-MiniLM-L6-v2 (384d) |
| PDF | pdfmake (server-side) |
| Infra | Docker Compose + multi-stage build |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/unificando/medicine.git
cd medicine/medicamentos

# 2. Configure
cp .env.example .env

# 3. Execute
docker compose up -d
```

Acesse [http://localhost:11006](http://localhost:11006)

---

## Instalação Manual

```bash
# 1. Dependências
npm install

# 2. Banco de dados
docker compose up -d db

# 3. Prisma
npx prisma generate
npx prisma migrate deploy

# 4. Seed dos dados ANVISA
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx prisma/seed.ts

# 5. Gerar embeddings (busca semântica)
npx tsx scripts/generate-embeddings.ts

# 6. Dev server
npm run dev
```

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `AUTH_SECRET` | Chave secreta JWT (`openssl rand -base64 32`) | Sim |
| `ADMIN_EMAIL` | Email do admin inicial | Sim |
| `ADMIN_PASSWORD` | Senha do admin inicial | Sim |
| `BASE_URL` | URL base do site (para sitemap/robots) | Não |
| `ANVISA_MEDICINES_URL` | URL do CSV de medicamentos ANVISA | Não |
| `ANVISA_PRICES_URL` | URL do CSV de preços CMED | Não |
| `EMBEDDING_MODEL` | Modelo de embeddings (default: Xenova/all-MiniLM-L6-v2) | Não |

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server na porta 11006 |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar em produção |
| `npm run lint` | ESLint |
| `npm run seed` | Importar dados ANVISA |
| `npm run embeddings` | Gerar embeddings de busca semântica |
| `npm run migrate` | Aplicar migrations do Prisma |
| `npm run generate` | Gerar cliente Prisma |
| `npm run docker:up` | Docker Compose up |
| `npm run docker:down` | Docker Compose down |

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Home com busca semântica |
| `/buscar-avancado` | Busca textual com filtros avançados |
| `/medicamento/[id]` | Detalhes do medicamento (preços, similares, bula) |
| `/referencias` | Lista de medicamentos de referência |
| `/referencias/[name]` | Similares de uma referência específica |
| `/atc` | Navegação por árvore ATC |
| `/atc/[code]` | Medicamentos por código ATC |
| `/detentor/[cnpj]` | Medicamentos de um detentor |
| `/compare` | Comparação lado a lado |
| `/dashboard` | Estatísticas com filtros interativos |
| `/sobre` | Sobre o projeto e fontes de dados |
| `/admin/login` | Login do administrador |
| `/admin/import` | Sincronização ANVISA + Preços |

---

## API Pública

```bash
# Listar medicamentos (paginado)
curl http://localhost:11006/api/medicines?page=1&pageSize=10

# Filtrar
curl "http://localhost:11006/api/medicines?category=Similar&status=Ativo"

# Exportar CSV
curl "http://localhost:11006/api/medicines?format=csv" -o medicamentos.csv

# Health check
curl http://localhost:11006/api/health
```

---

## Arquitetura

```
medicamentos/src/
├── app/                  # Páginas (App Router)
│   ├── buscar-avancado/  # Busca avançada
│   ├── medicamento/      # Detalhe do medicamento
│   ├── referencias/      # Referências
│   ├── atc/              # Classificação ATC
│   ├── dashboard/        # Dashboard estatístico
│   ├── compare/          # Comparação
│   ├── admin/            # Painel administrativo
│   └── api/              # Rotas de API
├── components/
│   ├── layout/           # Header, Footer
│   ├── medicines/        # Componentes de domínio
│   ├── admin/            # Componentes do admin
│   ├── dashboard/        # Componentes do dashboard
│   └── ui/               # Primitivos reutilizáveis
├── hooks/                # Hooks customizados
├── lib/
│   ├── actions/          # Server Actions
│   ├── config.ts         # Configurações centralizadas
│   └── constants.ts      # Constantes nomeadas
└── types/                # Interfaces TypeScript
```

### Princípios de Código

- **SRP** — Cada componente e função faz uma coisa
- **OCP** — Extensível por composição, não por modificação
- **LSP** — Tipos substituíveis sem quebra
- **ISP** — Interfaces mínimas e segregadas
- **DIP** — Depende de abstrações (config, types), não de implementações concretas
- **DRY** — Constantes nomeadas, componentes reutilizáveis
- **Clean Code** — Sem `any`, sem magic numbers, nomes reveladores

---

## Design System

O projeto usa identidade visual **Healthcare Moderno** — amarelo neon (#ccff00) como acento de marca, preto como primary, branco como fundo. Dark mode via CSS variables.

Veja o detalhamento completo em [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

---

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root
- **HTTP**: security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **Rate Limit**: 60 req/min nas rotas `/api/*`
- **Auth**: proteção das rotas `/admin/*` via NextAuth
- **Sanitização**: Escape de CSV, validação de inputs

---

## Fontes de Dados

- **Medicamentos**: [Dados Abertos ANVISA](https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV)
- **Preços**: [Tabela CMED](https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv)
- **Portal**: [dados.anvisa.gov.br](https://dados.anvisa.gov.br/dados/)

---

## Contribuindo

Contribuições são bem-vindas! Abra uma issue ou envie um pull request.

---

## Licença

MIT
