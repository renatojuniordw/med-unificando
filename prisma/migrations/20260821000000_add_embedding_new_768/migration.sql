-- Adiciona nova coluna de embedding com 768 dimensoes (multilingual-e5-base)
-- A coluna antiga (embedding vector(384)) eh mantida durante a transicao
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS embedding_new vector(768);

-- Indice HNSW (melhor que IVFFLAT: nao precisa de tabela nao-vazia, melhor recall)
-- So criar se o indice nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_medicines_embedding_new'
  ) THEN
    CREATE INDEX idx_medicines_embedding_new
      ON medicines USING hnsw (embedding_new vector_cosine_ops);
  END IF;
END $$;
