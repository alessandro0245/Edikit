-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PreviewStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "render_jobs" ADD COLUMN IF NOT EXISTS "previewStatus" "PreviewStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "render_jobs" ADD COLUMN IF NOT EXISTS "previewError" TEXT;

-- For existing jobs where previewUrl or outputUrl is an MP4, mark previewStatus as READY
UPDATE "render_jobs"
SET "previewStatus" = 'READY'
WHERE "previewUrl" IS NOT NULL
   OR ("status" = 'COMPLETED' AND "outputUrl" IS NOT NULL AND "outputUrl" NOT ILIKE '%.mov%');
