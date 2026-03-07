/*
  Warnings:

  - The values [BASIC,PRO] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('FREE', 'STARTER', 'CREATOR', 'STUDIO');
ALTER TABLE "public"."users" ALTER COLUMN "planType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "planType" TYPE "PlanType_new" USING ("planType"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "public"."PlanType_old";
ALTER TABLE "users" ALTER COLUMN "planType" SET DEFAULT 'FREE';
COMMIT;

-- AlterTable
ALTER TABLE "render_jobs" ALTER COLUMN "creditsUsed" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 0;
