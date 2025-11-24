/*
  Warnings:

  - Made the column `quizInternalId` on table `Question` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quizInternalId_fkey";

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "quizInternalId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizInternalId_fkey" FOREIGN KEY ("quizInternalId") REFERENCES "Quiz"("internalId") ON DELETE RESTRICT ON UPDATE CASCADE;
