/*
  Warnings:

  - You are about to drop the column `course_id` on the `classes` table. All the data in the column will be lost.
  - Added the required column `program_id` to the `classes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_course_id_fkey";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "course_id",
ADD COLUMN     "program_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
