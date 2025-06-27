-- AlterTable
ALTER TABLE "products" ADD COLUMN     "approvalReason" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
