-- AlterTable
ALTER TABLE "SriSupplementaryDocument" ADD COLUMN "shipmentId" TEXT,
ADD COLUMN "carrierGuideNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SriSupplementaryDocument_shipmentId_key" ON "SriSupplementaryDocument"("shipmentId");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_shipmentId_idx" ON "SriSupplementaryDocument"("shipmentId");

-- AddForeignKey
ALTER TABLE "SriSupplementaryDocument" ADD CONSTRAINT "SriSupplementaryDocument_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
