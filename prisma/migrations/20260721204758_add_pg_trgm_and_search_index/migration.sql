-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for trigram-based keyword search on medicine fields
CREATE INDEX IF NOT EXISTS idx_medicines_search_fields
  ON "medicines" USING GIN (
    "pharmaceuticalForm" gin_trgm_ops,
    "therapeuticClass" gin_trgm_ops,
    "activeIngredient" gin_trgm_ops,
    "tradeName" gin_trgm_ops,
    "indications" gin_trgm_ops
  );
