# Banco de Dados

## Tecnologia

PostgreSQL 16 via Prisma 7 ORM.

## Migrations

Total: 7 migrations (em `prisma/migrations/`):

| Migration | Descrição |
|-----------|-----------|
| `init` | Tabela `medicines` inicial |
| `add_users` | Modelo `User` para autenticação |
| `enrich_medicine_model` | Campos: category, atcCode, status, etc. |
| `add_prices` | Modelo `Price` para preços CMED |
| `add_synonyms_indications` | Campos `synonyms` e `indications` |
| `add_sync_log` | Modelo `SyncLog` para log de sincronizações |

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
  anvisaFileDate       DateTime? // Data do arquivo ANVISA (Last-Modified do CSV)
  lastImportAt         DateTime? // Data da última importação
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([reference])
  @@index([activeIngredient])
  @@index([tradeName])
  @@index([similarHolder])
  @@index([category])
  @@index([status])
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
  type      String   // 'medicines' | 'prices'
  count     Int      // Quantidade de registros importados
  status    String   // 'success' | 'error'
  message   String?  // Mensagem de erro (se houver)
  createdAt DateTime @default(now())

  @@map("sync_logs")
}
```

## Índices

| Tabela | Índices | Queries beneficiadas |
|--------|---------|----------------------|
| medicines | reference, activeIngredient, tradeName, similarHolder, category, status | Busca textual, autocomplete, filtros por categoria/situação |
| prices | reference, cnpj | Join com medicines por registro, filtro por empresa |

## Embeddings

Os embeddings **não** ficam no banco de dados. São armazenados como arquivos binários:

- `public/embeddings-header.json`: metadados (`{ count: 32585, dim: 384, ids: [...] }`)
- `public/embeddings.bin`: Float32Array raw (~47MB)

Motivo: são carregados em memória pelo runtime ONNX (Xenova Transformers) para busca semântica. Não faz sentido armazená-los em linhas do banco.

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
```
