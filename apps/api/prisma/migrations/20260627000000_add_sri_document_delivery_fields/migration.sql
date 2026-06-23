-- Add delivery tracking fields to SRI documents
ALTER TABLE "Invoice" ADD COLUMN "deliveryStatus" TEXT,
                        ADD COLUMN "deliveredAt" TIMESTAMP(3),
                        ADD COLUMN "deliveryError" TEXT;

ALTER TABLE "CreditNote" ADD COLUMN "deliveryStatus" TEXT,
                           ADD COLUMN "deliveredAt" TIMESTAMP(3),
                           ADD COLUMN "deliveryError" TEXT;
