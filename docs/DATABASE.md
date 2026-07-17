# Banco de Dados

## Tecnologia

PostgreSQL 16 via Prisma 7 ORM.

## Modelos

### Medicine

```prisma
model Medicine {
  id                   Int      @id @default(autoincrement())
  reference            String   // Número de registro ANVISA (9 dígitos)
  activeIngredient     String   // Princípio ativo
  tradeName            String   // Nome comercial
  similarHolder        String   @map("holder_of_similar_medicine_registration")  // Detentor do registro
  pharmaceuticalForm   String   // Forma farmacêutica
  concentration        String   // Concentração
  inclusionDate        String   // Data de inclusão na lista
  category             String?  // Similar, Genérico, Novo, Específico, Fitoterápico, Biológico, Dinamizado, Radiofármaco
  referenceMedicine    String?  // Medicamento de referência
  atcCode              String?  // Código ATC
  prescriptionType     String?  // Tarja (tipo de prescrição)
  status               String?  // Ativo / Inativo
  authorization        String?  // Número de autorização
  presentationCount    Int?     // Quantidade de apresentações
  synonyms             String?  // Sinônimos do produto
  indications          String?  // Indicações terapêuticas
  anvisaFileDate       DateTime? // Data do arquivo ANVISA (Last-Modified)
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

Cardinalidade: ~32.585 registros (07/2026).

### Price

```prisma
model Price {
  id           Int      @id @default(autoincrement())
  reference    String   // Registro ANVISA (primeiros 9 dígitos)
  cnpj         String   // CNPJ do detentor
  company      String   // Razão social
  productName  String   // Nome do produto
  presentation String   // Apresentação (dosagem + embalagem)
  substance    String   // Substância
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

Cardinalidade: ~53.422 registros.

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

## Migrations

As migrations ficam em `prisma/migrations/` e são versionadas.

```bash
# Criar nova migration
npx prisma migrate dev --name descricao_da_mudanca

# Aplicar migrations em produção
npm run migrate

# Gerar cliente Prisma
npm run generate
```

## Índices

| Tabela | Índices | Query beneficiada |
|--------|---------|-------------------|
| medicines | reference, activeIngredient, tradeName, similarHolder, category, status | Busca textual, filtros |
| prices | reference, cnpj | Join com medicines, filtro por empresa |

## Embeddings

Os embeddings são armazenados em arquivos binários em `public/`:
- `embeddings-header.json`: metadados (count, dim, ids)
- `embeddings.bin`: Float32Array raw (32585 × 384 = ~47MB)

Não ficam no banco de dados porque são carregados em memória pelo runtime ONNX.
