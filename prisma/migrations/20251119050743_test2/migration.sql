-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "quizInternalId" INTEGER;

-- CreateTable
CREATE TABLE "Quiz" (
    "internalId" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("internalId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_id_key" ON "Quiz"("id");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizInternalId_fkey" FOREIGN KEY ("quizInternalId") REFERENCES "Quiz"("internalId") ON DELETE SET NULL ON UPDATE CASCADE;
