/*
  Warnings:

  - A unique constraint covering the columns `[invitation_token_hash]` on the table `tenant_memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenant_memberships" ADD COLUMN     "invitation_expires_at" TIMESTAMP(6),
ADD COLUMN     "invitation_token_hash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_invitation_token_hash_key" ON "tenant_memberships"("invitation_token_hash");
