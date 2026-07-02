-- Remove unused ALEGRA accounting provider enum value
ALTER TYPE "AccountingProviderType" RENAME TO "AccountingProviderType_old";
CREATE TYPE "AccountingProviderType" AS ENUM ('CONSOLE', 'SIIGO');
ALTER TABLE "AccountingSyncRecord"
  ALTER COLUMN "provider" TYPE "AccountingProviderType"
  USING ("provider"::text::"AccountingProviderType");
DROP TYPE "AccountingProviderType_old";
