-- CreateEnum
CREATE TYPE "RenderType" AS ENUM ('TEMPLATE', 'AI_PROMPT');

-- AlterTable
ALTER TABLE "render_jobs" ADD COLUMN     "aiConfig" JSONB,
ADD COLUMN     "promptText" TEXT,
ADD COLUMN     "remotionBucketName" TEXT,
ADD COLUMN     "remotionRenderId" TEXT,
ADD COLUMN     "renderType" "RenderType" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN     "s3OutputKey" TEXT,
ALTER COLUMN "templateId" DROP NOT NULL,
ALTER COLUMN "customizations" DROP NOT NULL;
