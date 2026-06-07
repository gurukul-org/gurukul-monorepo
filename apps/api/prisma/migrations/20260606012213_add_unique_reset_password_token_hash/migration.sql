-- DropIndex
DROP INDEX IF EXISTS "users_reset_password_token_hash_idx";

-- AlterTable: add unique constraint on reset_password_token_hash
ALTER TABLE "users" ADD CONSTRAINT "users_reset_password_token_hash_key" UNIQUE ("reset_password_token_hash");
