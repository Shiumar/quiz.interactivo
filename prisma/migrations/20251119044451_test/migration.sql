-- CreateTable
CREATE TABLE "Question" (
    "internalId" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("internalId")
);

-- CreateTable
CREATE TABLE "Option" (
    "internalId" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionInternalId" INTEGER NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("internalId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_id_key" ON "Question"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Option_id_key" ON "Option"("id");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionInternalId_fkey" FOREIGN KEY ("questionInternalId") REFERENCES "Question"("internalId") ON DELETE RESTRICT ON UPDATE CASCADE;
