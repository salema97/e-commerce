-- AlterEnum: replace IN_PROGRESS with PENDING
CREATE TYPE "ConversationStatus_new" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

UPDATE "Conversation" SET "status" = 'OPEN' WHERE "status" = 'IN_PROGRESS';

ALTER TABLE "Conversation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Conversation" ALTER COLUMN "status" TYPE "ConversationStatus_new" USING ("status"::text::"ConversationStatus_new");
ALTER TABLE "Conversation" ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "ConversationStatus";
ALTER TYPE "ConversationStatus_new" RENAME TO "ConversationStatus";

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable Conversation
DROP INDEX "Conversation_userId_idx";
DROP INDEX "Conversation_customerPhone_idx";
DROP INDEX "Conversation_status_idx";
DROP INDEX "Conversation_createdAt_idx";

ALTER TABLE "Conversation"
DROP COLUMN "customerPhone",
DROP COLUMN "customerName",
DROP COLUMN "source",
ADD COLUMN "remoteJid" TEXT NOT NULL DEFAULT '',
ADD COLUMN "instance" TEXT NOT NULL DEFAULT 'ecommerce',
ADD COLUMN "contactName" TEXT,
ADD COLUMN "lastMessageAt" TIMESTAMP(3),
ADD COLUMN "unreadCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Conversation" ALTER COLUMN "remoteJid" DROP DEFAULT;

CREATE INDEX "Conversation_remoteJid_idx" ON "Conversation"("remoteJid");
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- AlterTable Message
DROP INDEX "Message_conversationId_idx";
DROP INDEX "Message_createdAt_idx";

ALTER TABLE "Message"
DROP COLUMN "direction",
DROP COLUMN "status",
DROP COLUMN "senderType",
ADD COLUMN "remoteJid" TEXT NOT NULL DEFAULT '',
ADD COLUMN "instance" TEXT NOT NULL DEFAULT 'ecommerce',
ADD COLUMN "direction" "MessageDirection" NOT NULL DEFAULT 'INBOUND',
ADD COLUMN "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN "externalMessageId" TEXT,
ADD COLUMN "externalStatus" TEXT,
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "sentAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "readAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Message" ALTER COLUMN "remoteJid" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "Message_externalMessageId_key" ON "Message"("externalMessageId");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
