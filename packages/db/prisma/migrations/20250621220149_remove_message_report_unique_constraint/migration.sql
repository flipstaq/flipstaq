-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('USER', 'PRODUCT', 'MESSAGE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "targetUserId" TEXT,
    "targetProductId" TEXT,
    "targetMessageId" TEXT,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "ipAddress" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporterId_type_targetUserId_key" ON "reports"("reporterId", "type", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporterId_type_targetProductId_key" ON "reports"("reporterId", "type", "targetProductId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
