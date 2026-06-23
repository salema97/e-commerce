-- Deduplicate back-in-stock alerts before enforcing uniqueness per product/email pair.
DELETE FROM "BackInStockAlert" AS newer
USING "BackInStockAlert" AS older
WHERE newer.id > older.id
  AND newer."productId" = older."productId"
  AND newer.email = older.email;

CREATE UNIQUE INDEX "BackInStockAlert_productId_email_key" ON "BackInStockAlert"("productId", "email");
