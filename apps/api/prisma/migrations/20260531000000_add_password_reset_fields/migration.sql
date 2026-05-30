-- AlterTable
ALTER TABLE "users" ADD COLUMN "reset_password_token_hash" VARCHAR(255),
ADD COLUMN "reset_password_expires_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "users_reset_password_token_hash_idx" ON "users"("reset_password_token_hash");
