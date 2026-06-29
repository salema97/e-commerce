-- CreateEnum
CREATE TYPE "MarketingPlacementType" AS ENUM ('POPUP', 'BANNER', 'PROMO_STRIP');

-- CreateEnum
CREATE TYPE "MarketingPlacementSlot" AS ENUM ('APP_LAUNCH', 'HOME_HERO', 'STORE_TOP', 'STORE_INLINE');

-- CreateEnum
CREATE TYPE "MarketingPlacementPlatform" AS ENUM ('WEB', 'MOBILE', 'ALL');

-- CreateTable
CREATE TABLE "MarketingPlacement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MarketingPlacementType" NOT NULL,
    "slot" "MarketingPlacementSlot" NOT NULL,
    "platform" "MarketingPlacementPlatform" NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "promotionId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "showOncePerSession" BOOLEAN NOT NULL DEFAULT false,
    "showOnceEver" BOOLEAN NOT NULL DEFAULT false,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingPlacement_isActive_slot_platform_idx" ON "MarketingPlacement"("isActive", "slot", "platform");

-- CreateIndex
CREATE INDEX "MarketingPlacement_priority_idx" ON "MarketingPlacement"("priority");

-- CreateIndex
CREATE INDEX "MarketingPlacement_startsAt_endsAt_idx" ON "MarketingPlacement"("startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "MarketingPlacement" ADD CONSTRAINT "MarketingPlacement_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
