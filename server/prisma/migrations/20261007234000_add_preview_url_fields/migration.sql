-- AlterTable
ALTER TABLE "render_jobs" ADD COLUMN IF NOT EXISTS "previewUrl" TEXT;
ALTER TABLE "render_jobs" ADD COLUMN IF NOT EXISTS "s3PreviewKey" TEXT;
