-- Phase 15: B2B, quotes, marketplace, accounting

CREATE TYPE "CompanyUserRole" AS ENUM ('OWNER', 'BUYER', 'APPROVER', 'VIEWER');
CREATE TYPE "NetPaymentTerms" AS ENUM ('NET_0', 'NET_15', 'NET_30', 'NET_60');
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');
CREATE TYPE "MarketplaceChannel" AS ENUM ('CONSOLE', 'MERCADO_LIBRE');
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ERROR', 'UNPUBLISHED');
CREATE TYPE "MarketplaceImportStatus" AS ENUM ('PENDING', 'IMPORTED', 'FAILED');
CREATE TYPE "AccountingProviderType" AS ENUM ('CONSOLE', 'SIIGO', 'ALEGRA');
CREATE TYPE "AccountingSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

ALTER TYPE "OrderChannel" ADD VALUE 'B2B';
ALTER TYPE "OrderChannel" ADD VALUE 'MARKETPLACE';

ALTER TABLE "Order" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Order" ADD COLUMN "purchaseOrderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "netPaymentTerms" "NetPaymentTerms";
ALTER TABLE "Order" ADD COLUMN "marketplaceChannel" "MarketplaceChannel";
ALTER TABLE "Order" ADD COLUMN "marketplaceExternalId" TEXT;
ALTER TABLE "Order" ADD COLUMN "marketplaceFees" DECIMAL(12,2);

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPaymentTerms" "NetPaymentTerms" NOT NULL DEFAULT 'NET_30',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CompanyUserRole" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyPriceList" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyPriceList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "companyId" TEXT,
    "requestedByUserId" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "purchaseOrderNumber" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "convertedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "MarketplaceChannel" NOT NULL,
    "externalId" TEXT,
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceOrderImport" (
    "id" TEXT NOT NULL,
    "channel" "MarketplaceChannel" NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "orderId" TEXT,
    "status" "MarketplaceImportStatus" NOT NULL DEFAULT 'PENDING',
    "fees" DECIMAL(12,2),
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceOrderImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountingSyncRecord" (
    "id" TEXT NOT NULL,
    "provider" "AccountingProviderType" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "AccountingSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountingSyncRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_taxId_key" ON "Company"("taxId");
CREATE INDEX "Company_isActive_idx" ON "Company"("isActive");
CREATE UNIQUE INDEX "CompanyUser_companyId_userId_key" ON "CompanyUser"("companyId", "userId");
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");
CREATE UNIQUE INDEX "CompanyPriceList_companyId_productId_variantId_key" ON "CompanyPriceList"("companyId", "productId", "variantId");
CREATE INDEX "CompanyPriceList_companyId_idx" ON "CompanyPriceList"("companyId");
CREATE INDEX "CompanyPriceList_productId_idx" ON "CompanyPriceList"("productId");
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE UNIQUE INDEX "Quote_convertedOrderId_key" ON "Quote"("convertedOrderId");
CREATE INDEX "Quote_companyId_idx" ON "Quote"("companyId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_expiresAt_idx" ON "Quote"("expiresAt");
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");
CREATE UNIQUE INDEX "MarketplaceListing_productId_channel_key" ON "MarketplaceListing"("productId", "channel");
CREATE INDEX "MarketplaceListing_channel_idx" ON "MarketplaceListing"("channel");
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");
CREATE UNIQUE INDEX "MarketplaceOrderImport_orderId_key" ON "MarketplaceOrderImport"("orderId");
CREATE UNIQUE INDEX "MarketplaceOrderImport_channel_externalOrderId_key" ON "MarketplaceOrderImport"("channel", "externalOrderId");
CREATE INDEX "MarketplaceOrderImport_status_idx" ON "MarketplaceOrderImport"("status");
CREATE UNIQUE INDEX "AccountingSyncRecord_provider_resourceType_resourceId_key" ON "AccountingSyncRecord"("provider", "resourceType", "resourceId");
CREATE INDEX "AccountingSyncRecord_status_idx" ON "AccountingSyncRecord"("status");
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");
CREATE INDEX "Order_marketplaceChannel_idx" ON "Order"("marketplaceChannel");
CREATE INDEX "Order_marketplaceExternalId_idx" ON "Order"("marketplaceExternalId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyPriceList" ADD CONSTRAINT "CompanyPriceList_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyPriceList" ADD CONSTRAINT "CompanyPriceList_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyPriceList" ADD CONSTRAINT "CompanyPriceList_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_convertedOrderId_fkey" FOREIGN KEY ("convertedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderImport" ADD CONSTRAINT "MarketplaceOrderImport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
