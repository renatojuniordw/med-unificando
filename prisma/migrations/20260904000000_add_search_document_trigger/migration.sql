-- Trigger que garante busca textual nunca vazia após um sync/import.
-- A coluna search_document não é mais GENERATED (20260903 arcabouço); sem um
-- trigger, um createMany em lote deixaria os registros com search_document NULL
-- até rodar scripts/generate-tsvector.ts manualmente. Este trigger preenche NA
-- HORA do insert/update com os campos crus (suficiente para searchability);
-- o refinamento de alta qualidade (nomes ATC/forma resolvidos) continua sendo
-- feito pelo script scripts/generate-tsvector.ts / src/lib/tsvector-refresh.ts.
-- use COALESCE para não sobrescrever vetores gerenciados pelo script.

CREATE OR REPLACE FUNCTION medicines_search_document_fn() RETURNS trigger AS $$
BEGIN
  NEW."search_document" := COALESCE(
    NEW."search_document",
    to_tsvector('portuguese', concat_ws(' ',
      NEW."tradeName",
      NEW."activeIngredient",
      NEW."pharmaceuticalForm",
      NEW."therapeuticClass",
      NEW."atcCode",
      NEW."indications",
      NEW."synonyms",
      NEW."concentration",
      NEW."category",
      NEW."prescriptionType",
      NEW."holder_of_similar_medicine_registration",
      NEW."status",
      CASE WHEN NEW."farmacia_popular" THEN 'farmacia popular' END
    ))
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medicines_search_document ON medicines;
CREATE TRIGGER trg_medicines_search_document
BEFORE INSERT OR UPDATE OF
  "tradeName", "activeIngredient", "pharmaceuticalForm", "therapeuticClass",
  "atcCode", "indications", "synonyms", "concentration", "category",
  "prescriptionType", "holder_of_similar_medicine_registration", "status",
  "farmacia_popular"
ON medicines
FOR EACH ROW EXECUTE FUNCTION medicines_search_document_fn();