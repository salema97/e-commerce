-- Add idempotency key to Payment for duplicate payment prevention

ALTER TABLE "Payment" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_idempotencyKey_idx" ON "Payment"("idempotencyKey");
