-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('WHATSAPP', 'WEB');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('CUSTOMER', 'AGENT', 'BOT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('PRODUCT', 'FAQ', 'CMS_PAGE');

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN "channel" "ConversationChannel" NOT NULL DEFAULT 'WHATSAPP';
ALTER TABLE "Conversation" ADD COLUMN "webSessionId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "botEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "senderType" "MessageSenderType" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN "metaDescription" TEXT;

-- CreateTable Faq
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable CmsPage
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeChunk
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProductContentDraft
CREATE TABLE "ProductContentDraft" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "imageAlts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable BotInteraction
CREATE TABLE "BotInteraction" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "chunkIds" TEXT[],
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_webSessionId_key" ON "Conversation"("webSessionId");
CREATE INDEX "Conversation_channel_idx" ON "Conversation"("channel");
CREATE INDEX "Conversation_webSessionId_idx" ON "Conversation"("webSessionId");
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");
CREATE INDEX "Faq_isPublished_idx" ON "Faq"("isPublished");
CREATE INDEX "CmsPage_isPublished_idx" ON "CmsPage"("isPublished");
CREATE INDEX "KnowledgeChunk_sourceType_sourceId_idx" ON "KnowledgeChunk"("sourceType", "sourceId");
CREATE UNIQUE INDEX "ProductContentDraft_productId_key" ON "ProductContentDraft"("productId");
CREATE INDEX "BotInteraction_conversationId_idx" ON "BotInteraction"("conversationId");
CREATE INDEX "BotInteraction_createdAt_idx" ON "BotInteraction"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductContentDraft" ADD CONSTRAINT "ProductContentDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotInteraction" ADD CONSTRAINT "BotInteraction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill sender types
UPDATE "Message" SET "senderType" = 'CUSTOMER' WHERE "direction" = 'INBOUND';
UPDATE "Message" SET "senderType" = 'AGENT' WHERE "direction" = 'OUTBOUND';
