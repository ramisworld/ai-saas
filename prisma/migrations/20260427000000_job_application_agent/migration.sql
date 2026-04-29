-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CareerSourceType" AS ENUM ('CV', 'PROFILE', 'PROJECT', 'EXPERIENCE', 'CERTIFICATION', 'EDUCATION', 'ACHIEVEMENT', 'GOAL', 'NOTE');

-- CreateEnum
CREATE TYPE "ApplicationDocumentType" AS ENUM ('MATCH_ANALYSIS', 'TAILORED_CV', 'COVER_LETTER', 'RECRUITER_MESSAGE', 'INTERVIEW_PREP', 'GAP_ANALYSIS');

-- CreateEnum
CREATE TYPE "TrackerStatus" AS ENUM ('DRAFT_READY', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('JOB_ANALYSIS', 'APPLICATION_PACK', 'EMBEDDING');

-- CreateTable
CREATE TABLE "UserApiLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserApiLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_current_period_end" TIMESTAMP(3),
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerVault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "structuredProfile" JSONB,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultId" TEXT,
    "type" "CareerSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "parsedData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerChunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultId" TEXT,
    "sourceId" TEXT,
    "sourceType" "CareerSourceType",
    "title" TEXT,
    "text" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "company" TEXT,
    "roleTitle" TEXT,
    "jobUrl" TEXT,
    "rawText" TEXT,
    "parsedData" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationPack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "strongMatches" JSONB,
    "weakSpots" JSONB,
    "missingSkills" JSONB,
    "atsKeywords" JSONB,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationPackId" TEXT NOT NULL,
    "type" "ApplicationDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTrackerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "applicationPackId" TEXT,
    "company" TEXT,
    "role" TEXT NOT NULL,
    "status" "TrackerStatus" NOT NULL DEFAULT 'DRAFT_READY',
    "nextAction" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationTrackerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UsageType" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApiLimit_userId_key" ON "UserApiLimit"("userId");
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");
CREATE UNIQUE INDEX "UserSubscription_stripe_customer_id_key" ON "UserSubscription"("stripe_customer_id");
CREATE UNIQUE INDEX "UserSubscription_stripe_subscription_id_key" ON "UserSubscription"("stripe_subscription_id");
CREATE UNIQUE INDEX "CareerVault_userId_key" ON "CareerVault"("userId");
CREATE INDEX "CareerSource_userId_idx" ON "CareerSource"("userId");
CREATE INDEX "CareerSource_vaultId_idx" ON "CareerSource"("vaultId");
CREATE INDEX "CareerSource_type_idx" ON "CareerSource"("type");
CREATE INDEX "CareerChunk_userId_idx" ON "CareerChunk"("userId");
CREATE INDEX "CareerChunk_vaultId_idx" ON "CareerChunk"("vaultId");
CREATE INDEX "CareerChunk_sourceId_idx" ON "CareerChunk"("sourceId");
CREATE INDEX "JobPosting_userId_idx" ON "JobPosting"("userId");
CREATE INDEX "ApplicationPack_userId_idx" ON "ApplicationPack"("userId");
CREATE INDEX "ApplicationPack_jobPostingId_idx" ON "ApplicationPack"("jobPostingId");
CREATE INDEX "ApplicationDocument_userId_idx" ON "ApplicationDocument"("userId");
CREATE UNIQUE INDEX "ApplicationDocument_applicationPackId_type_key" ON "ApplicationDocument"("applicationPackId", "type");
CREATE UNIQUE INDEX "ApplicationTrackerEntry_applicationPackId_key" ON "ApplicationTrackerEntry"("applicationPackId");
CREATE INDEX "ApplicationTrackerEntry_userId_idx" ON "ApplicationTrackerEntry"("userId");
CREATE INDEX "ApplicationTrackerEntry_status_idx" ON "ApplicationTrackerEntry"("status");
CREATE INDEX "UsageRecord_userId_idx" ON "UsageRecord"("userId");
CREATE INDEX "UsageRecord_type_idx" ON "UsageRecord"("type");
CREATE INDEX "UsageRecord_createdAt_idx" ON "UsageRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "CareerSource" ADD CONSTRAINT "CareerSource_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "CareerVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerChunk" ADD CONSTRAINT "CareerChunk_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "CareerVault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerChunk" ADD CONSTRAINT "CareerChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CareerSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationPack" ADD CONSTRAINT "ApplicationPack_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationPackId_fkey" FOREIGN KEY ("applicationPackId") REFERENCES "ApplicationPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationTrackerEntry" ADD CONSTRAINT "ApplicationTrackerEntry_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationTrackerEntry" ADD CONSTRAINT "ApplicationTrackerEntry_applicationPackId_fkey" FOREIGN KEY ("applicationPackId") REFERENCES "ApplicationPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
