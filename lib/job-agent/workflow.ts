import { ApplicationDocumentType, CareerSourceType, UsageType } from "@prisma/client";

import prismadb from "@/lib/prismadb";
import {
  calculateMatchScore,
  extractCareerProfile,
  generateApplicationDocuments,
  parseJobPosting,
} from "@/lib/job-agent/agents";
import { extractJobTextFromUrl } from "@/lib/job-agent/link-extraction";
import { createTrackerEntry, saveApplicationPack } from "@/lib/job-agent/persistence";
import { embedAndStoreCareerSource, retrieveCareerChunks } from "@/lib/job-agent/retrieval";
import { checkUsageLimit, recordUsage } from "@/lib/job-agent/usage";
import type { ApplicationWorkflowResult, CareerInput, WorkflowProgressStep } from "@/lib/job-agent/types";

export type RunApplicationWorkflowInput = {
  userId: string;
  targetRole: string;
  jobText?: string;
  jobUrl?: string;
  profileText: string;
  cvText?: string;
  onProgress?: (step: WorkflowProgressStep) => void | Promise<void>;
};

function combinedCareerText(input: RunApplicationWorkflowInput) {
  return [input.cvText, input.profileText].filter(Boolean).join("\n\n");
}

async function progress(
  callback: RunApplicationWorkflowInput["onProgress"],
  step: WorkflowProgressStep
) {
  if (callback) {
    await callback(step);
  }
}

export async function runApplicationWorkflow(
  input: RunApplicationWorkflowInput
): Promise<ApplicationWorkflowResult> {
  const packLimit = await checkUsageLimit(input.userId, UsageType.APPLICATION_PACK);

  if (!packLimit.allowed) {
    throw new Error(
      `Monthly application pack limit reached (${packLimit.used}/${packLimit.limit}). Upgrade to keep generating packs.`
    );
  }

  await progress(input.onProgress, "analyzing-job");

  const fetchedJob = input.jobUrl ? await extractJobTextFromUrl(input.jobUrl) : { text: "", error: "" };
  const usableJobText = input.jobText?.trim() || fetchedJob.text;
  const parsedJob = await parseJobPosting({
    targetRole: input.targetRole,
    jobText: usableJobText,
    jobUrl: input.jobUrl,
  });

  const jobPosting = await prismadb.jobPosting.create({
    data: {
      userId: input.userId,
      targetRole: input.targetRole,
      company: parsedJob.company,
      roleTitle: parsedJob.roleTitle,
      jobUrl: input.jobUrl || null,
      rawText: usableJobText || null,
      parsedData: {
        ...parsedJob,
        linkExtractionWarning: fetchedJob.error || null,
      },
      confidence: parsedJob.confidence,
    },
  });

  await recordUsage(input.userId, {
    type: UsageType.JOB_ANALYSIS,
    metadata: {
      jobPostingId: jobPosting.id,
    },
  });

  await progress(input.onProgress, "creating-vault");

  const careerText = combinedCareerText(input);
  const profileResult = await extractCareerProfile({
    profileText: careerText,
    targetRole: input.targetRole,
  });

  const vault = await prismadb.careerVault.upsert({
    where: {
      userId: input.userId,
    },
    create: {
      userId: input.userId,
      summary: profileResult.profile.summary,
      structuredProfile: profileResult.profile,
      completeness: profileResult.completeness,
    },
    update: {
      summary: profileResult.profile.summary,
      structuredProfile: profileResult.profile,
      completeness: profileResult.completeness,
    },
  });

  await progress(input.onProgress, "embedding-career");

  const sources: CareerInput[] = [];

  if (input.cvText?.trim()) {
    sources.push({
      title: "Uploaded CV",
      type: CareerSourceType.CV,
      text: input.cvText,
    });
  }

  if (input.profileText?.trim()) {
    sources.push({
      title: "Profile context",
      type: CareerSourceType.PROFILE,
      text: input.profileText,
    });
  }

  for (const source of sources) {
    await embedAndStoreCareerSource({
      userId: input.userId,
      vaultId: vault.id,
      source,
    });
  }

  await recordUsage(input.userId, {
    type: UsageType.EMBEDDING,
    amount: sources.length || 1,
    metadata: {
      vaultId: vault.id,
    },
  });

  await progress(input.onProgress, "retrieving-evidence");

  const retrievalQuery = [
    parsedJob.roleTitle,
    parsedJob.company,
    parsedJob.requiredSkills.join(", "),
    parsedJob.responsibilities.join(" "),
    parsedJob.atsKeywords.join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  const evidence = await retrieveCareerChunks({
    userId: input.userId,
    query: retrievalQuery,
    limit: 10,
  });

  await progress(input.onProgress, "calculating-match");

  const match = await calculateMatchScore({
    parsedJob,
    evidence,
  });

  await progress(input.onProgress, "tailoring-cv");
  await progress(input.onProgress, "writing-cover-letter");
  await progress(input.onProgress, "writing-recruiter-message");
  await progress(input.onProgress, "building-interview-prep");

  const documents = await generateApplicationDocuments({
    parsedJob,
    profile: profileResult.profile,
    match,
    evidence,
  });

  await progress(input.onProgress, "saving-pack");

  const pack = await saveApplicationPack({
    userId: input.userId,
    jobPostingId: jobPosting.id,
    parsedJob,
    match,
    evidence,
    documents: [
      {
        type: ApplicationDocumentType.TAILORED_CV,
        title: "Tailored CV",
        content: documents.tailoredCv,
      },
      {
        type: ApplicationDocumentType.COVER_LETTER,
        title: "Cover letter",
        content: documents.coverLetter,
      },
      {
        type: ApplicationDocumentType.RECRUITER_MESSAGE,
        title: "Recruiter message",
        content: documents.recruiterMessage,
      },
      {
        type: ApplicationDocumentType.INTERVIEW_PREP,
        title: "Interview prep",
        content: documents.interviewPrep,
      },
    ],
  });

  const trackerEntry = await createTrackerEntry({
    userId: input.userId,
    jobPostingId: jobPosting.id,
    applicationPackId: pack.id,
    tracker: {
      company: parsedJob.company,
      role: parsedJob.roleTitle || input.targetRole,
    },
  });

  await recordUsage(input.userId, {
    type: UsageType.APPLICATION_PACK,
    metadata: {
      packId: pack.id,
      trackerEntryId: trackerEntry.id,
    },
  });

  return {
    packId: pack.id,
    trackerEntryId: trackerEntry.id,
    jobPostingId: jobPosting.id,
  };
}
