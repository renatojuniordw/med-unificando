-- Remove o campo "salt": o hash bcrypt já embute o salt no próprio hash,
-- tornando a coluna redundante (resquício de esquema legado).
ALTER TABLE "users" DROP COLUMN "salt";