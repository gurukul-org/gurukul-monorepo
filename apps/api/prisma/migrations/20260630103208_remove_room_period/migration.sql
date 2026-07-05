/*
  Warnings:

  - You are about to drop the column `period` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `classes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "classes" DROP COLUMN "period",
DROP COLUMN "room";
