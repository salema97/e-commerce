-- Phase 12: shipping, tax categories, shipments
CREATE TYPE "TaxCategory" AS ENUM ('STANDARD', 'REDUCED', 'ZERO', 'EXEMPT');
CREATE TYPE "ShippingZoneType" AS ENUM ('DOMESTIC', 'INTERNATIONAL', 'EXCLUDED');
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED');

ALTER TABLE "Product" ADD COLUMN "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "ReturnRequest"
  ADD COLUMN "returnCarrier" TEXT,
  ADD COLUMN "returnTrackingNumber" TEXT,
  ADD COLUMN "returnTrackingUrl" TEXT;

CREATE TABLE "ShippingZone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "zoneType" "ShippingZoneType" NOT NULL DEFAULT 'DOMESTIC',
  "provinces" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "baseRate" DECIMAL(12,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShippingZone_code_key" ON "ShippingZone"("code");
CREATE INDEX "ShippingZone_zoneType_isActive_idx" ON "ShippingZone"("zoneType", "isActive");

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

INSERT INTO "ShippingZone" ("id", "name", "code", "zoneType", "provinces", "baseRate", "isActive", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Ecuador continental', 'EC-DOMESTIC', 'DOMESTIC', ARRAY[]::TEXT[], 5.00, true, CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000102', 'Galápagos', 'EC-GALAPAGOS', 'EXCLUDED', ARRAY['Galápagos'], 15.00, true, CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000103', 'Internacional', 'INTL', 'INTERNATIONAL', ARRAY[]::TEXT[], 25.00, true, CURRENT_TIMESTAMP);
