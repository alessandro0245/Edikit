-- AlterTable
ALTER TABLE "render_jobs" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "render_jobs_expiresAt_idx" ON "render_jobs"("expiresAt");
