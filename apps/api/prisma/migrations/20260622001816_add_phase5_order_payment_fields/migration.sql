-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('WEB', 'MOBILE', 'POS');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "channel" "OrderChannel" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "reservationExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "checkoutSessionId" TEXT,
ADD COLUMN     "providerMetadata" JSONB;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "providerMetadata" JSONB,
ADD COLUMN     "providerRefundId" TEXT,
ADD COLUMN     "requestedById" TEXT;

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_orderId_key" ON "Receipt"("orderId");
CREATE INDEX "Receipt_orderId_idx" ON "Receipt"("orderId");
CREATE INDEX "Receipt_number_idx" ON "Receipt"("number");

-- CreateIndex
CREATE INDEX "Order_channel_idx" ON "Order"("channel");
CREATE INDEX "Order_couponCode_idx" ON "Order"("couponCode");
CREATE INDEX "Order_reservationExpiresAt_idx" ON "Order"("reservationExpiresAt");

-- CreateIndex
CREATE INDEX "Payment_checkoutSessionId_idx" ON "Payment"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "Refund_providerRefundId_idx" ON "Refund"("providerRefundId");
CREATE INDEX "Refund_requestedById_idx" ON "Refund"("requestedById");
CREATE INDEX "Refund_approvedById_idx" ON "Refund"("approvedById");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
