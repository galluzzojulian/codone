-- Rename existing columns for consistency
ALTER TABLE "Sites" 
RENAME COLUMN "head_code" TO "head_files";

ALTER TABLE "Sites" 
RENAME COLUMN "body_code" TO "body_files";

-- Set defaults if they're null
UPDATE "Sites" SET "head_files" = '[]' WHERE "head_files" IS NULL;
UPDATE "Sites" SET "body_files" = '[]' WHERE "body_files" IS NULL;

-- Comment on columns
COMMENT ON COLUMN "Sites"."head_files" IS 'JSON array of file IDs for the site head';
COMMENT ON COLUMN "Sites"."body_files" IS 'JSON array of file IDs for the site body'; 