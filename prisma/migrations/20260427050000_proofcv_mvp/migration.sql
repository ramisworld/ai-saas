-- CreateEnum
CREATE TYPE "ProofCvMode" AS ENUM ('SCRATCH', 'EXISTING_CV');

-- CreateEnum
CREATE TYPE "ProofCvSessionStatus" AS ENUM ('LANDING', 'AUTH_GATE', 'JOB_CONTEXT', 'CV_OR_PROFILE_CONTEXT', 'PROCESSING_CONTEXT', 'AI_FOLLOWUP_QUESTIONS', 'JOB_FIT_PLAN', 'GENERATING_CV', 'CV_EDITOR', 'EXPORT_READY');

-- CreateEnum
CREATE TYPE "EvidenceItemType" AS ENUM ('PROJECT', 'SKILL', 'WORK_EXPERIENCE', 'EDUCATION', 'CERTIFICATION', 'ACHIEVEMENT', 'TOOL', 'GOAL');

-- CreateEnum
CREATE TYPE "EvidenceItemSource" AS ENUM ('UPLOADED_CV', 'USER_BRAIN_DUMP', 'FOLLOWUP_ANSWER', 'GENERATED_CORRECTION');

-- CreateEnum
CREATE TYPE "EvidenceConfidence" AS ENUM ('CONFIRMED', 'INFERRED', 'NEEDS_CONFIRMATION');

-- CreateTable
CREATE TABLE "ApplicationSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "anonymousSessionId" TEXT,
    "targetRoleRaw" TEXT NOT NULL,
    "targetCompany" TEXT,
    "targetRole" TEXT,
    "cvMode" "ProofCvMode" NOT NULL,
    "status" "ProofCvSessionStatus" NOT NULL DEFAULT 'LANDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobContext" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "originalRoleText" TEXT NOT NULL,
    "pastedJobDescription" TEXT,
    "uploadedScreenshotName" TEXT,
    "uploadedScreenshotContentType" TEXT,
    "parsedRequirements" JSONB,
    "parsedKeywords" JSONB,
    "seniorityLevel" TEXT,
    "responsibilities" JSONB,
    "companyTone" TEXT,
    "mustHaveSkills" JSONB,
    "niceToHaveSkills" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "sessionId" TEXT,
    "type" "EvidenceItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tools" JSONB,
    "skills" JSONB,
    "impact" TEXT,
    "source" "EvidenceItemSource" NOT NULL,
    "confidence" "EvidenceConfidence" NOT NULL,
    "proofStrength" INTEGER NOT NULL DEFAULT 50,
    "senioritySignal" TEXT,
    "needsUserConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvArtifact" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "sessionId" TEXT NOT NULL,
    "jobFitPlan" JSONB,
    "cvSections" JSONB,
    "atsText" TEXT,
    "verificationReport" JSONB,
    "evidenceMap" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationSession_clerkUserId_idx" ON "ApplicationSession"("clerkUserId");

-- CreateIndex
CREATE INDEX "ApplicationSession_anonymousSessionId_idx" ON "ApplicationSession"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "ApplicationSession_status_idx" ON "ApplicationSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobContext_sessionId_key" ON "JobContext"("sessionId");

-- CreateIndex
CREATE INDEX "JobContext_clerkUserId_idx" ON "JobContext"("clerkUserId");

-- CreateIndex
CREATE INDEX "EvidenceItem_clerkUserId_idx" ON "EvidenceItem"("clerkUserId");

-- CreateIndex
CREATE INDEX "EvidenceItem_sessionId_idx" ON "EvidenceItem"("sessionId");

-- CreateIndex
CREATE INDEX "EvidenceItem_type_idx" ON "EvidenceItem"("type");

-- CreateIndex
CREATE INDEX "EvidenceItem_source_idx" ON "EvidenceItem"("source");

-- CreateIndex
CREATE INDEX "CvArtifact_clerkUserId_idx" ON "CvArtifact"("clerkUserId");

-- CreateIndex
CREATE INDEX "CvArtifact_sessionId_idx" ON "CvArtifact"("sessionId");

-- AddForeignKey
ALTER TABLE "JobContext" ADD CONSTRAINT "JobContext_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ApplicationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ApplicationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvArtifact" ADD CONSTRAINT "CvArtifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ApplicationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
