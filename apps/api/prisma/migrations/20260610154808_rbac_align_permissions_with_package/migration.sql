/*
  Warnings:

  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `tenant_id` on table `roles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "permission_id" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tenant_id" SET NOT NULL;

-- DropTable
DROP TABLE "permissions";
