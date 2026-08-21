-- Finaliza a migracao de embeddings para 768 dimensoes (multilingual-e5-base)
-- Remove a coluna antiga (384 dims) e promove embedding_new para o nome definitivo

DROP INDEX IF EXISTS idx_medicines_embedding;
ALTER TABLE medicines DROP COLUMN IF EXISTS embedding;
ALTER TABLE medicines RENAME COLUMN embedding_new TO embedding;
ALTER INDEX IF EXISTS idx_medicines_embedding_new RENAME TO idx_medicines_embedding;
