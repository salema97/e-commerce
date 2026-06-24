-- Phase 17: POS, BOPIS, subscriptions, dropshipping, internal marketplace (schema foundation)

CREATE TYPE "ShippingMethodType" AS ENUM ('DELIVERY', 'PICKUP', 'POS_IMMEDIATE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "SubscriptionInterval" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE "FulfillmentSource" AS ENUM ('WAREHOUSE', 'DROPSHIP', 'SELLER');
CREATE TYPE "SellerPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE "MarketplaceDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED');

ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP' AFTER 'PROCESSING';

ALTER TABLE "Product" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Product" ADD COLUMN "isSubscription" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Supplier" ADD COLUMN "dropshipEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Supplier" ADD COLUMN "dropshipCommissionRate" DECIMAL(5,2);
ALTER TABLE "Supplier" ADD COLUMN "fulfillmentContactEmail" TEXT;

ALTER TABLE "Order" ADD COLUMN "shippingMethod" "ShippingMethodType" NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "Order" ADD COLUMN "pickupLocationId" TEXT;
ALTER TABLE "Order" ADD COLUMN "posRegisterId" TEXT;
ALTER TABLE "Order" ADD COLUMN "pickupReadyAt" TIMESTAMP(3);

ALTER TABLE "OrderItem" ADD COLUMN "fulfillmentSource" "FulfillmentSource" NOT NULL DEFAULT 'WAREHOUSE';
ALTER TABLE "OrderItem" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "dropshipCommissionAmount" DECIMAL(12,2);
ALTER TABLE "OrderItem" ADD COLUMN "sellerCommissionAmount" DECIMAL(12,2);

CREATE TABLE "StoreLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "supportsPickup" BOOLEAN NOT NULL DEFAULT true,
    "supportsPos" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosRegister" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastClosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PosRegister_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "interval" "SubscriptionInterval" NOT NULL DEFAULT 'MONTHLY',
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "status" "SellerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerPayout" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderId" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "SellerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SellerPayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceDispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "openedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MarketplaceDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceDispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreLocation_code_key" ON "StoreLocation"("code");
CREATE INDEX "StoreLocation_isActive_idx" ON "StoreLocation"("isActive");
CREATE INDEX "StoreLocation_supportsPickup_idx" ON "StoreLocation"("supportsPickup");
CREATE INDEX "StoreLocation_supportsPos_idx" ON "StoreLocation"("supportsPos");

CREATE UNIQUE INDEX "PosRegister_locationId_code_key" ON "PosRegister"("locationId", "code");
CREATE INDEX "PosRegister_locationId_idx" ON "PosRegister"("locationId");
CREATE INDEX "PosRegister_isActive_idx" ON "PosRegister"("isActive");

CREATE UNIQUE INDEX "SubscriptionPlan_productId_key" ON "SubscriptionPlan"("productId");
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");
CREATE INDEX "SubscriptionPlan_interval_idx" ON "SubscriptionPlan"("interval");

CREATE UNIQUE INDEX "CustomerSubscription_stripeSubscriptionId_key" ON "CustomerSubscription"("stripeSubscriptionId");
CREATE INDEX "CustomerSubscription_userId_idx" ON "CustomerSubscription"("userId");
CREATE INDEX "CustomerSubscription_planId_idx" ON "CustomerSubscription"("planId");
CREATE INDEX "CustomerSubscription_status_idx" ON "CustomerSubscription"("status");

CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");
CREATE UNIQUE INDEX "Seller_slug_key" ON "Seller"("slug");
CREATE INDEX "Seller_status_idx" ON "Seller"("status");
CREATE INDEX "Seller_slug_idx" ON "Seller"("slug");

CREATE INDEX "SellerPayout_sellerId_idx" ON "SellerPayout"("sellerId");
CREATE INDEX "SellerPayout_orderId_idx" ON "SellerPayout"("orderId");
CREATE INDEX "SellerPayout_status_idx" ON "SellerPayout"("status");

CREATE INDEX "MarketplaceDispute_orderId_idx" ON "MarketplaceDispute"("orderId");
CREATE INDEX "MarketplaceDispute_sellerId_idx" ON "MarketplaceDispute"("sellerId");
CREATE INDEX "MarketplaceDispute_status_idx" ON "MarketplaceDispute"("status");
CREATE INDEX "MarketplaceDispute_openedByUserId_idx" ON "MarketplaceDispute"("openedByUserId");

CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX "Supplier_dropshipEnabled_idx" ON "Supplier"("dropshipEnabled");
CREATE INDEX "Order_shippingMethod_idx" ON "Order"("shippingMethod");
CREATE INDEX "Order_pickupLocationId_idx" ON "Order"("pickupLocationId");
CREATE INDEX "Order_posRegisterId_idx" ON "Order"("posRegisterId");
CREATE INDEX "OrderItem_supplierId_idx" ON "OrderItem"("supplierId");
CREATE INDEX "OrderItem_sellerId_idx" ON "OrderItem"("sellerId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "StoreLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_posRegisterId_fkey" FOREIGN KEY ("posRegisterId") REFERENCES "PosRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PosRegister" ADD CONSTRAINT "PosRegister_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StoreLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceDispute" ADD CONSTRAINT "MarketplaceDispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceDispute" ADD CONSTRAINT "MarketplaceDispute_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceDispute" ADD CONSTRAINT "MarketplaceDispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
