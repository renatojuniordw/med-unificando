-- Torna search_document uma coluna regular (nao GENERATED).
-- O script scripts/generate-tsvector.ts e a fonte autoritativa do tsvector,
-- resolvendo nomes de forma farmaceutica/ATC (o GENERATED usava codigos crus).
-- Assim o script deixa de conflitar com a coluna gerada automaticamente.

ALTER TABLE medicines DROP COLUMN IF EXISTS search_document;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS search_document tsvector;
CREATE INDEX IF NOT EXISTS idx_medicines_search_document ON medicines USING GIN (search_document);

-- Indices adicionais para filtros usados em producao (ILIKE %x%) e ordenacoes
CREATE INDEX IF NOT EXISTS idx_medicines_reference_medicine ON medicines ("referenceMedicine");
CREATE INDEX IF NOT EXISTS idx_medicines_atc_code ON medicines ("atcCode");
CREATE INDEX IF NOT EXISTS idx_medicines_inclusion_date ON medicines ("inclusionDate");