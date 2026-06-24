-- Phase 16: privacy compliance fields
ALTER TABLE "User" ADD COLUMN "ccpaDoNotSell" BOOLEAN NOT NULL DEFAULT false;
