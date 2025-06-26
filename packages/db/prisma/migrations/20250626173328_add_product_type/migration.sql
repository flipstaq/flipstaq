/*
  Warnings:

  - Added the required column `type` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('DIGITAL', 'PHYSICAL', 'SERVICE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "type" "ProductType" NOT NULL;
