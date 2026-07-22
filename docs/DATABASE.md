# Banco de Dados

## Tecnologia

PostgreSQL 16 via Prisma 7 ORM.

Extensões:
- `pgvector` — embeddings vetoriais para busca semântica
- `pg_trgm` — similaridade trigram para autocomplete fuzzy

## Migrations

Total: 10 migrations (em `prisma/migrations/`):

| Migration | Descrição |
|-----------|-----------|
| `init` | Tabela `medicines` inicial |
| `add_users` | Modelo `User` para autenticação |
| `enrich_medicine_model` | Campos: category, atcCode, status, etc. |
| `add_prices` | Modelo `Price` para preços CMED |
| `add_synonyms_indications` | Campos `synonyms` e `indications` |
| `add_sync_log` | Modelo `SyncLog` para log de sincronizações |
| `add_therapeutic_class` | Campo `therapeuticClass` no modelo Medicine |
| `add_farmacia_popular` | Campo `farmaciaPopular` no modelo Medicine |
| `add_pg_trgm_and_search_index` | Extensão pg_trgm, índices GIN trigram, modelo SearchFeedback |
| `add_pgvector_tsvector` | Colunas `embedding` (vector(384)) e `searchDocument` (tsvector) |

## Modelos

### Medicine (32.585 registros)

```prisma
model Medicine {
  id                   Int      @id @default(autoincrement())
  reference            String   // Número de registro ANVISA (9 dígitos)
  activeIngredient     String   // Princípio ativo
  tradeName            String   // Nome comercial
  similarHolder        String   @map("holder_of_similar_medicine_registration")  // Detentor
  pharmaceuticalForm   String   // Forma farmacêutica
  concentration        String   // Concentração
  inclusionDate        String   // Data de publicação ANVISA
  category             String?  // Similar, Genérico, Novo, Específico, Fitoterápico, Biológico, Dinamizado, Radiofármaco
  referenceMedicine    String?  // Medicamento de referência (para similares)
  atcCode              String?  // Código ATC
  prescriptionType     String?  // Tarja (tipo de prescrição)
  status               String?  // Ativo / Inativo
  authorization        String?  // Número de autorização
  presentationCount    Int?     // Quantidade de apresentações registradas
  synonyms             String?  // Sinônimos do produto (quando disponível)
  indications          String?  // Indicações terapêuticas (quando disponível)
  therapeuticClass     String?  // Classe terapêutica
  anvisaFileDate       DateTime? // Data do arquivo ANVISA (Last-Modified do CSV)
  lastImportAt         DateTime? // Data da última importação
  farmaciaPopular      Boolean  @default(false) @map("farmacia_popular") // Farmácia Popular (MS)
  embedding            Unsupported("vector(384)")? // Embedding pgvector para busca semântica
  searchDocument       Unsupported("tsvector")?   @map("search_document") // Documento tsvector para busca textual
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([reference])
  @@index([activeIngredient])
  @@index([tradeName])
  @@index([similarHolder])
  @@index([category])
  @@index([status])
  @@index([farmaciaPopular])
  @@map("medicines")
}
```

### Price (53.422 registros)

```prisma
model Price {
  id           Int      @id @default(autoincrement())
  reference    String   // Registro ANVISA (primeiros 9 dígitos do NU_REGISTRO)
  cnpj         String   // CNPJ do detentor
  company      String   // Razão social
  productName  String   // Nome do produto
  presentation String   // Apresentação (dosagem + embalagem)
  substance    String   // Substância ativa
  pf0Price     Float?   // Preço Fábrica ICMS 0%
  pf18Price    Float?   // Preço Fábrica ICMS 18%
  hospitalOnly String?  // Restrição hospitalar (S/N)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([reference])
  @@index([cnpj])
  @@map("prices")
}
```

### User

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String
  role              String   @default("USER")
  password          String
  salt              String
  confirmationToken String?
  recoverToken      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("users")
}
```

Cardinalidade: 1 usuário admin por instalação.

### SyncLog

```prisma
model SyncLog {
  id        Int      @id @default(autoincrement())
  type      String   // 'medicines' | 'prices' | 'embeddings' | 'farmacia-popular'
  count     Int      // Quantidade de registros importados
  status    String   // 'success' | 'error'
  message   String?  // Mensagem de erro (se houver)
  createdAt DateTime @default(now())

  @@map("sync_logs")
}
```

### SearchFeedback

```prisma
model SearchFeedback {
  id           Int      @id @default(autoincrement())
  query        String   // Termo buscado
  medicineId   Int      @map("medicine_id") // ID do medicamento clicado
  medicineName String   @map("medicine_name") // Nome do medicamento clicado
  feedback     String   // "helpful" | "not_helpful"
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([query, feedback])
  @@index([medicineId])
  @@index([createdAt])
  @@map("search_feedback")
}
```

## Índices

| Tabela | Índices | Queries beneficiadas |
|--------|---------|----------------------|
| medicines | reference, activeIngredient, tradeName, similarHolder, category, status, farmaciaPopular | Busca textual, autocomplete, filtros por categoria/situação/Farmácia Popular |
| medicines | `idx_medicines_embedding` (IVFFlat, lists=180) | Busca vetorial O(log n) por similaridade semântica |
| medicines | `idx_medicines_search_document` (GIN) | Busca tsvector O(log n) por texto completo |
| prices | reference, cnpj | Join com medicines por registro, filtro por empresa |
| search_feedback | query+feedback, medicineId, createdAt | Análise de feedback, agregação por consulta |

## Embeddings

Os embeddings são armazenados diretamente no banco de dados PostgreSQL usando a extensão **pgvector**:

- **Modelo**: `multilingual-e5-small` (384 dimensões)
- **Índice**: IVFFlat com `lists=180` para busca vetorial O(log n)
- **Geração**: batch de 50 registros, apenas medicamentos sem embedding
- **Texto indexado**: `nome | princípio ativo | categoria | detentor | forma farmacêutica | concentração | sinônimos | indicações | situação | registro`

### Colunas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `medicines.embedding` | `vector(384)` | Embedding gerado por `multilingual-e5-small` |
| `medicines.search_document` | `tsvector` | Documento de texto completo para busca keyword |

### Índices

- `idx_medicines_embedding`: IVFFlat (lists=180) para busca vetorial O(log n)
- `idx_medicines_search_document`: GIN para busca tsvector O(log n)

## Comandos

```bash
# Criar migration
npx prisma migrate dev --name descricao

# Aplicar em produção
npm run migrate

# Gerar cliente
npm run generate

# Seed
npm run seed

# Gerar tsvector search documents
npm run tsvector

# Gerar embeddings para busca semântica
npm run search-index
```
