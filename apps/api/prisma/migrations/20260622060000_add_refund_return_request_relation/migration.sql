-- Add optional return request relation to Refund
ALTER TABLE "Refund" ADD COLUMN "returnRequestId" TEXT;

CREATE INDEX "Refund_returnRequestId_idx" ON "Refund"("returnRequestId");

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_returnRequestId_fkey"
  FOREIGN KEY ("returnRequestId")
  REFERENCES "ReturnRequest"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Add optional exchange order reference to ReturnRequest
ALTER TABLE "ReturnRequest" ADD COLUMN "exchangeOrderId" TEXT;

CREATE INDEX "ReturnRequest_exchangeOrderId_idx" ON "ReturnRequest"("exchangeOrderId");

ALTER TABLE "ReturnRequest"
  ADD CONSTRAINT "ReturnRequest_exchangeOrderId_fkey"
  FOREIGN KEY ("exchangeOrderId")
  REFERENCES "Order"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Add compensating state for credit-note failures
ALTER TYPE "ReturnStatus" ADD VALUE 'RESOLUTION_PENDING_CREDIT_NOTE';
