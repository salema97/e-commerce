-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorClerkUserId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_actorClerkUserId_idx" ON "AuditLog"("actorClerkUserId");
