-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_documents_type_language_idx" ON "legal_documents"("type", "language");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_language_isActive_key" ON "legal_documents"("type", "language", "isActive");

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
