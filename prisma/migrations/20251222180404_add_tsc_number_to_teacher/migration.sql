/*
  Warnings:

  - A unique constraint covering the columns `[tscNumber]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "tscNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teachers_tscNumber_key" ON "teachers"("tscNumber");
