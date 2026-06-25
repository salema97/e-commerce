-- Drop Clerk-specific columns and add native auth

DROP INDEX IF EXISTS "User_clerkUserId_key";
DROP INDEX IF EXISTS "User_clerkUserId_idx";

ALTER TABLE "User" DROP COLUMN IF EXISTS "clerkUserId";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

DROP INDEX IF EXISTS "AuditLog_actorClerkUserId_idx";
ALTER TABLE "AuditLog" DROP COLUMN IF EXISTS "actorClerkUserId";

CREATE TABLE IF NOT EXISTS "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

ALTER TABLE "AuthSession" DROP CONSTRAINT IF EXISTS "AuthSession_userId_fkey";
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
