-- Add PENDING status to document enums so pre-SRI records can express "allocated, awaiting submission"
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "CreditNoteStatus" ADD VALUE IF NOT EXISTS 'PENDING';
