-- DropIndex
DROP INDEX "InvoiceSequence_documentType_key";

-- AlterTable
ALTER TABLE "InvoiceSequence" RENAME COLUMN "authorizedFrom" TO "startNumber";
ALTER TABLE "InvoiceSequence" RENAME COLUMN "authorizedTo" TO "endNumber";
ALTER TABLE "InvoiceSequence" ADD COLUMN "establishmentCode" TEXT NOT NULL DEFAULT '001';
ALTER TABLE "InvoiceSequence" ADD COLUMN "emissionPointCode" TEXT NOT NULL DEFAULT '001';

-- Backfill existing rows with the default establishment/emission codes
UPDATE "InvoiceSequence" SET "establishmentCode" = '001', "emissionPointCode" = '001';

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSequence_documentType_establishmentCode_emissionPointCode_key" ON "InvoiceSequence"("documentType", "establishmentCode", "emissionPointCode");
