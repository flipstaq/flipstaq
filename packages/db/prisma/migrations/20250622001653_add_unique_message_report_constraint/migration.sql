/*
  Warnings:

  - A unique constraint covering the columns `[reporterId,type,targetMessageId]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reports_reporterId_type_targetMessageId_key" ON "reports"("reporterId", "type", "targetMessageId");
