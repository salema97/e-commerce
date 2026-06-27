-- CreateTable
CREATE TABLE "ServientregaCity" (
    "id" TEXT NOT NULL,
    "servientregaCityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "normalizedName" TEXT NOT NULL,
    "normalizedProvince" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'EC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServientregaCity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServientregaCity_servientregaCityId_key" ON "ServientregaCity"("servientregaCityId");

-- CreateIndex
CREATE INDEX "ServientregaCity_normalizedName_normalizedProvince_idx" ON "ServientregaCity"("normalizedName", "normalizedProvince");

-- CreateIndex
CREATE INDEX "ServientregaCity_province_idx" ON "ServientregaCity"("province");
