# Med Unificando

Consulta inteligente de medicamentos intercambiáveis da ANVISA com busca semântica por IA local.

> Projeto ofertado por [Unificando](https://unificando.com.br) | Desenvolvido por [Renato Bezerra](https://renatobezerra.com.br)
> **Acesse:** [https://med.unificando.com.br](https://med.unificando.com.br)

---

## Funcionalidades

- **Busca textual** por referência, princípio ativo, nome comercial e categoria
- **Busca por descrição** — descreva o medicamento em linguagem natural
- **Busca híbrida** — pgvector + tsvector com RRF fusion para resultados mais precisos
- **Score adjustments** — relevância ajustada com base no feedback dos usuários
- **Search Feedback** — usuários podem avaliar resultados como útil/não útil
- **Busca por classe terapêutica** — filtre por classificação terapêutica ANVISA
- **Autocomplete** com debounce na busca
- **Farmácia Popular** — badge e filtro para medicamentos do programa
- **Comparação** lado a lado com destaque visual de diferenças
- **Explorar por referência** — veja todos os similares de um medicamento de referência
- **Navegação ATC** — explore por classificação Anatômica/Terapêutica/Química
- **Preços CMED** — visualize preços máximos ao consumidor com BarChart
- **Página do detentor** — todos os medicamentos de uma empresa
- **Estatísticas** com filtros interativos (ano, categoria, situação) e timeline
- **Exportação** em CSV e Excel (corretamente escaped)
- **Relatório PDF** do medicamento com identidade visual
- **Favoritos** — salve medicamentos de interesse (localStorage)
- **Buscas recentes** — últimas 5 buscas salvas
- **StatusPill** — indicador visual de situação (Ativo/Inativo)
- **ClipboardButton** — copiar número de registro com um clique
- **FavoriteButton** — favoritar medicamentos
- **RecentSearches** — acesso rápido às últimas consultas
- **ViewToggle** — alterna entre tabela e cards nos resultados
- **SelectedTags** — filtros ativos exibidos como tags
- **ExportButton** — exportação contextual (CSV/Excel)
- **ActionBar** — ações contextuais por página
- **Breadcrumbs** — navegação hierárquica
- **Dark mode** — tema claro/escuro com persistência
- **Sincronização automática** com dados abertos ANVISA
- **PWA** — instalável como app no celular
- **JSON-LD Schema.org/MedicalDrug** nas páginas de detalhe
- **OG Image** dinâmica por medicamento
- **Sitemap dinâmico** com 32K+ URLs
- **Robots.txt** com permissão para GPTBot, ClaudeBot, Google-Extended
- **ErrorBoundary** global
- **Loading skeleton** global
- **Página 404** customizada
- **ConsoleCredits** — informações do projeto no DevTools

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL 16 + pgvector |
| ORM | Prisma 7 |
| Testes | Vitest |
| Estilo | Tailwind CSS v4 |
| Autenticação | NextAuth v5 (Credentials, JWT) |
| IA (embeddings) | Xenova Transformers (ONNX local) |
| IA (busca) | multilingual-e5-small (384d) + pgvector + tsvector |
| PDF | pdfmake (server-side) |
| Exportação | xlsx |
| Infra | Docker Compose + multi-stage build |

---

## Quick Start

```bash
# 1. Clone
git clone git@github.com:renatojuniordw/med-unificando.git
cd med-unificando

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
npm run search-index

# 6. Gerar tsvector search documents
npm run tsvector

# 7. Dev server
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
| `ANVISA_THERAPEUTIC_CLASS_URL` | URL do CSV de classes terapêuticas | Não |
| `EMBEDDING_MODEL` | Modelo de embeddings (default: Xenova/multilingual-e5-small) | Não |

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server na porta 11006 |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar em produção |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Vitest coverage |
| `npm run seed` | Importar dados ANVISA |
| `npm run embeddings` | Gerar embeddings de busca semântica |
| `npm run tsvector` | Gerar tsvector search documents |
| `npm run farmacia-popular` | Sincronizar lista Farmácia Popular |
| `npm run backfill-indications` | Backfill de indicações terapêuticas |
| `npm run migrate` | Aplicar migrations do Prisma |
| `npm run generate` | Gerar cliente Prisma |
| `npm run docker:up` | Docker Compose up |
| `npm run docker:down` | Docker Compose down |
| `npm run docker:build` | Docker build sem cache |

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
| `/admin/import` | Sincronização ANVISA + Preços + Farmácia Popular |
| `/admin/medicamentos` | Busca admin de medicamentos |
| `/admin/medicamentos/[id]` | Edição admin de medicamento |
| `/admin/search-feedback` | Console de feedback das buscas |

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

# Search Feedback
curl -X POST http://localhost:11006/api/search-feedback \
  -H "Content-Type: application/json" \
  -d '{"query":"...","medicineId":1,"medicineName":"...","feedback":"helpful"}'
```

---

## Arquitetura

```
src/
├── app/                       # Páginas (App Router)
│   ├── buscar-avancado/       # Busca avançada
│   ├── medicamento/           # Detalhe do medicamento
│   ├── referencias/           # Referências
│   ├── atc/                   # Classificação ATC
│   ├── dashboard/             # Dashboard estatístico
│   ├── compare/               # Comparação
│   ├── admin/                 # Painel administrativo
│   │   ├── medicamentos/      # Admin de medicamentos
│   │   └── search-feedback/   # Feedback das buscas
│   └── api/                   # Rotas de API
├── components/
│   ├── layout/                # Header, Footer, Breadcrumbs
│   ├── medicines/             # Componentes de domínio
│   ├── admin/                 # Componentes do admin
│   ├── dashboard/             # Componentes do dashboard
│   └── ui/                    # Primitivos reutilizáveis
├── hooks/
│   ├── use-favorites.ts       # Favoritos (localStorage)
│   ├── use-recent-searches.ts # Buscas recentes
│   └── use-debounced-search.ts # Busca com debounce
├── lib/
│   ├── actions/               # Server Actions (15)
│   ├── dictionaries/
│   │   ├── atc-codes.ts
│   │   ├── pharmaceutical-forms.ts
│   │   ├── prescription-types.ts
│   │   ├── therapeutic-classes.ts
│   │   └── therapeutic-class-indications.ts
│   ├── config.ts              # Configurações centralizadas
│   ├── constants.ts           # Constantes nomeadas
│   ├── format.ts              # Formatadores
│   ├── build-where.ts         # Montagem de WHERE dinâmico
│   ├── query-parser.ts        # Parsing de consultas
│   ├── keyword-utils.ts       # Utilitários de keyword
│   ├── search-relevance.ts    # Cálculo de relevância
│   ├── score-adjustments.ts   # Ajustes de score por feedback
│   ├── embeddings-generator.ts # Geração de embeddings
│   ├── pdf-parser.ts          # Parsing de PDF
│   └── theme-provider.tsx     # Tema claro/escuro
├── auth.ts                    # NextAuth config
├── proxy.ts                   # Rate limiter middleware
└── types/
    ├── medicine.ts            # Tipos de medicamento
    ├── next-auth.d.ts         # Extensão NextAuth
    ├── pdf-parse.d.ts         # Tipos PDF parse
    └── pdfmake.d.ts           # Tipos pdfmake
tests/                         # Testes Vitest
scripts/                       # Scripts utilitários (13)
prisma.config.ts
vitest.config.ts
postcss.config.mjs
eslint.config.mjs
docker-entrypoint.sh
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

Veja o detalhamento completo em [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md).

---

## Segurança

- **Docker**: read-only rootfs, `no-new-privileges`, `cap_drop ALL`, non-root
- **HTTP**: security headers (X-Frame-Options, X-Content-Type-Options, CSP com fontes específicas)
- **Rate Limit**: 60 req/min nas rotas `/api/*`
- **Auth**: proteção das rotas `/admin/*` via NextAuth
- **Sanitização**: Escape de CSV, validação de inputs, SearchFeedback sanitizado

---

## Fontes de Dados

- **Medicamentos**: [Dados Abertos ANVISA](https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV)
- **Preços**: [Tabela CMED](https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv)
- **Farmácia Popular**: PDF do Ministério da Saúde
- **Portal**: [dados.anvisa.gov.br](https://dados.anvisa.gov.br/dados/)

---

## Contribuindo

Contribuições são bem-vindas! Abra uma issue ou envie um pull request.

---

## Licença

MIT
