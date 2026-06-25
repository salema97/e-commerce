-- Add optional FK from Income.relatedOrderId to Order.id
ALTER TABLE "Income" ADD CONSTRAINT "Income_relatedOrderId_fkey"
  FOREIGN KEY ("relatedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Income_relatedOrderId_idx" ON "Income"("relatedOrderId");
