-- Tabela para registrar buscas realizadas (analytics)
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  top_score REAL,
  query_type TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para queries frequentes
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs (query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at DESC);
