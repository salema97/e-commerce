-- AlterTable
ALTER TABLE "CreditNote" ADD COLUMN "parentInvoiceAccessKey" TEXT;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_exchangeOrderId_key" UNIQUE ("exchangeOrderId");

-- CreateIndex
CREATE INDEX "CreditNote_parentInvoiceAccessKey_idx" ON "CreditNote"("parentInvoiceAccessKey");
