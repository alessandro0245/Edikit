-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'STARTER', 'CREATOR', 'STUDIO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RenderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('PURCHASE', 'RENDER', 'REFUND', 'BONUS', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "RenderType" AS ENUM ('TEMPLATE', 'AI_PROMPT');

-- CreateTable
CREATE TABLE "nexrender_templates" (
    "id" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nexrenderId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "compositions" JSONB NOT NULL,
    "layers" JSONB,
    "layerMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nexrender_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "render_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" INTEGER,
    "renderType" "RenderType" NOT NULL DEFAULT 'TEMPLATE',
    "status" "RenderStatus" NOT NULL DEFAULT 'PENDING',
    "nexrenderJobId" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "outputUrl" TEXT,
    "nexrenderOutputUrl" TEXT,
    "error" TEXT,
    "customizations" JSONB,
    "remotionRenderId" TEXT,
    "remotionBucketName" TEXT,
    "s3OutputKey" TEXT,
    "promptText" TEXT,
    "aiConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "render_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar" TEXT DEFAULT '',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "provider" TEXT NOT NULL DEFAULT 'email',
    "googleId" TEXT,
    "appleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT,
    "renderJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nexrender_templates_templateId_key" ON "nexrender_templates"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "nexrender_templates_nexrenderId_key" ON "nexrender_templates"("nexrenderId");

-- CreateIndex
CREATE UNIQUE INDEX "render_jobs_nexrenderJobId_key" ON "render_jobs"("nexrenderJobId");

-- CreateIndex
CREATE INDEX "render_jobs_userId_idx" ON "render_jobs"("userId");

-- CreateIndex
CREATE INDEX "render_jobs_nexrenderJobId_idx" ON "render_jobs"("nexrenderJobId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
