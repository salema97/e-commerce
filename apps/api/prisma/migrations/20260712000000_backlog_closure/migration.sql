-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "internalNotes" TEXT;

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialBalance" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "issuedToUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppQuickReply" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppQuickReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SriSupplementaryDocument" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "orderId" TEXT,
    "parentInvoiceAccessKey" TEXT,
    "sequenceNumber" TEXT,
    "authorizationNumber" TEXT,
    "authorizationDate" TIMESTAMP(3),
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "sriStatus" "SriDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "signedXml" TEXT,
    "reason" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sriResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SriSupplementaryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_issuedToUserId_idx" ON "GiftCard"("issuedToUserId");

-- CreateIndex
CREATE INDEX "GiftCard_isActive_idx" ON "GiftCard"("isActive");

-- CreateIndex
CREATE INDEX "WhatsAppQuickReply_isActive_sortOrder_idx" ON "WhatsAppQuickReply"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SriSupplementaryDocument_accessKey_key" ON "SriSupplementaryDocument"("accessKey");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_documentType_idx" ON "SriSupplementaryDocument"("documentType");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_orderId_idx" ON "SriSupplementaryDocument"("orderId");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_accessKey_idx" ON "SriSupplementaryDocument"("accessKey");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_status_idx" ON "SriSupplementaryDocument"("status");

-- CreateIndex
CREATE INDEX "SriSupplementaryDocument_createdAt_idx" ON "SriSupplementaryDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SriSupplementaryDocument" ADD CONSTRAINT "SriSupplementaryDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
