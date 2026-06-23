-- Phase 11: analytics event store
CREATE TABLE "AnalyticsEventRecord" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'api',
  "userId" TEXT,
  "sessionId" TEXT,
  "properties" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEventRecord_event_createdAt_idx" ON "AnalyticsEventRecord"("event", "createdAt");
CREATE INDEX "AnalyticsEventRecord_sessionId_idx" ON "AnalyticsEventRecord"("sessionId");
