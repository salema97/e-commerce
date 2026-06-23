-- Create required enums if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SriDocumentStatus') THEN
    CREATE TYPE "SriDocumentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'AUTHORIZED', 'REJECTED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SriDocumentJobStatus') THEN
    CREATE TYPE "SriDocumentJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DLQ');
  END IF;
END $$;

-- Invoice: SRI document tracking fields
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sequenceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "authorizationDate" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "xmlUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sriStatus" "SriDocumentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "lastError" TEXT;

-- CreditNote: SRI document tracking fields
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "sequenceNumber" TEXT;
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "authorizationDate" TIMESTAMP(3);
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "xmlUrl" TEXT;
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "sriStatus" "SriDocumentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "lastError" TEXT;

-- InvoiceSequence: rename range columns and add near-exhaustion alert tracking
ALTER TABLE "InvoiceSequence" RENAME COLUMN "startNumber" TO "authorizedFrom";
ALTER TABLE "InvoiceSequence" RENAME COLUMN "endNumber" TO "authorizedTo";
ALTER TABLE "InvoiceSequence" ADD COLUMN IF NOT EXISTS "nearExhaustionAlertSent" BOOLEAN NOT NULL DEFAULT false;

-- SriDocumentJob: tracks BullMQ jobs that process SRI documents
CREATE TABLE IF NOT EXISTS "SriDocumentJob" (
  "id" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "SriDocumentJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SriDocumentJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SriDocumentJob_jobId_key" ON "SriDocumentJob"("jobId");
CREATE INDEX IF NOT EXISTS "SriDocumentJob_documentId_idx" ON "SriDocumentJob"("documentId");
CREATE INDEX IF NOT EXISTS "SriDocumentJob_status_idx" ON "SriDocumentJob"("status");
CREATE INDEX IF NOT EXISTS "SriDocumentJob_documentType_status_idx" ON "SriDocumentJob"("documentType", "status");

-- Additional indexes for document status lookups
CREATE INDEX IF NOT EXISTS "Invoice_sriStatus_idx" ON "Invoice"("sriStatus");
CREATE INDEX IF NOT EXISTS "CreditNote_sriStatus_idx" ON "CreditNote"("sriStatus");
