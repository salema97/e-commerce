-- Add user profile fields used to populate SRI buyer data
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "identification" TEXT;

-- Add SRI buyer fields to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerIdentification" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerAddress" TEXT;

-- Add per-item tax/discount fields required for SRI XML totals
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5, 2) NOT NULL DEFAULT 15;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Rename InvoiceSequence.currentNumber to lastNumber to match the domain model
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'InvoiceSequence' AND column_name = 'currentNumber'
  ) THEN
    ALTER TABLE "InvoiceSequence" RENAME COLUMN "currentNumber" TO "lastNumber";
  END IF;
END $$;

-- Invoice: store only object keys, never public URLs or full XML in API responses
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "signedXml" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "xmlKey" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "pdfKey" TEXT;
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "xmlContent";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "xmlUrl";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "pdfUrl";

-- CreditNote: store only object keys, never public URLs or redundant XML content
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "xmlKey" TEXT;
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "pdfKey" TEXT;
ALTER TABLE "CreditNote" DROP COLUMN IF EXISTS "xmlContent";
ALTER TABLE "CreditNote" DROP COLUMN IF EXISTS "xmlUrl";
ALTER TABLE "CreditNote" DROP COLUMN IF EXISTS "pdfUrl";
