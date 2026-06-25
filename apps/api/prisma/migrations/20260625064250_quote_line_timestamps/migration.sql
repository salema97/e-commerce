/*
  Warnings:

  - Added the required column `updatedAt` to the `QuoteLine` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "KnowledgeChunk_embeddingVector_idx";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "direction" DROP DEFAULT;

-- AlterTable
ALTER TABLE "QuoteLine" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ShipmentItem" ALTER COLUMN "updatedAt" DROP DEFAULT;
