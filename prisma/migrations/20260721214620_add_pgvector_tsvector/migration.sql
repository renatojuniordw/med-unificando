CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS embedding vector(384);

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS search_document tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce("tradeName", '') || ' ' ||
      coalesce("activeIngredient", '') || ' ' ||
      coalesce("pharmaceuticalForm", '') || ' ' ||
      coalesce("therapeuticClass", '') || ' ' ||
      coalesce("indications", '') || ' ' ||
      coalesce("synonyms", '') || ' ' ||
      coalesce("concentration", '') || ' ' ||
      coalesce("category", '') || ' ' ||
      coalesce("prescriptionType", '') || ' ' ||
      coalesce("holder_of_similar_medicine_registration", '') || ' ' ||
      CASE WHEN "status" = 'Ativo' THEN 'ativo' ELSE 'inativo' END || ' ' ||
      CASE WHEN "farmacia_popular" = true THEN 'farmacia popular' ELSE '' END
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_medicines_search_document ON medicines USING GIN (search_document);

CREATE INDEX IF NOT EXISTS idx_medicines_embedding ON medicines USING IVFFLAT (embedding vector_cosine_ops) WITH (lists = 180);
