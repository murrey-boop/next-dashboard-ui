/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "subjects" ALTER COLUMN "code" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");
