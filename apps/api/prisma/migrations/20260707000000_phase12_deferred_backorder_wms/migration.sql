-- Phase 12 deferred: backorder, split shipments, labels, WMS fields
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_SHIPPED' BEFORE 'SHIPPED';

CREATE TYPE "OrderItemFulfillmentStatus" AS ENUM (
  'PENDING',
  'BACKORDERED',
  'ALLOCATED',
  'PARTIALLY_SHIPPED',
  'SHIPPED',
  'CANCELLED'
);

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowBackorder" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "fulfillmentStatus" "OrderItemFulfillmentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "quantityShipped" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "quantityBackordered" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Shipment"
  ADD COLUMN IF NOT EXISTS "labelUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "externalId" TEXT;

CREATE INDEX IF NOT EXISTS "Shipment_externalId_idx" ON "Shipment"("externalId");

CREATE TABLE IF NOT EXISTS "ShipmentItem" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShipmentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");
CREATE INDEX IF NOT EXISTS "ShipmentItem_orderItemId_idx" ON "ShipmentItem"("orderItemId");
