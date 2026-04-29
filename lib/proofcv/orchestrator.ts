import type { Prisma } from "@prisma/client";
import { z } from "zod";

import prismadb from "@/lib/prismadb";
import { generateProofJson, proofCvConfig } from "@/lib/proofcv/ai";
import { toDbCvMode, toDbStatus } from "@/lib/proofcv/db-mapping";
import {
  cvEditorSystemPrompt,
  cvWriterSystemPrompt,
  intakeSystemPrompt,
  planSystemPrompt,
  verifierSystemPrompt,
} from "@/lib/proofcv/prompts";
import {
  mockEvidenceItems,
  mockFollowUpQuestions,
  mockJobFitPlan,
  mockParsedJob,
  mockTailoredCv,
  mockVerification,
} from "@/lib/proofcv/mock";
import { retrieveRelevantEvidence, storeEvidenceItems } from "@/lib/proofcv/retrieval";
import {
  cvModeSchema,
  editCvResponseSchema,
  evidenceItemSchema,
  followUpQuestionSchema,
  generateCvResponseSchema,
  jobFitPlanSchema,
  MAX_BRAIN_DUMP_CHARS,
  MAX_JOB_DESCRIPTION_CHARS,
  parsedJobContextSchema,
  tailoredCvSchema,
  verificationReportSchema,
  type CreatePlanResponse,
  type CvMode,
  type EditCvResponse,
  type GenerateCvResponse,
  type JobFitPlan,
  type ParsedJobContext,
  type PrepareFollowupsResponse,
  type ProofCvEvidenceItem,
  type TailoredCv,
} from "@/lib/proofcv/schemas";

const evidenceItemsResponseSchema = z.object({
  evidenceItems: z.array(evidenceItemSchema).min(1).max(24),
});

const followUpResponseSchema = z.object({
  questions: z.array(followUpQuestionSchema).min(3).max(5),
});

function normalizeEvidenceItem(item: {
  id?: string;
  type: ProofCvEvidenceItem["type"];
  title: string;
  description: string;
  tools?: string[];
  skills?: string[];
  impact?: string | null;
  source: ProofCvEvidenceItem["source"];
  confidence: ProofCvEvidenceItem["confidence"];
  proofStrength?: number;
  senioritySignal?: string | null;
  needsUserConfirmation?: boolean;
}): ProofCvEvidenceItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    tools: item.tools || [],
    skills: item.skills || [],
    impact: item.impact ?? null,
    source: item.source,
    confidence: item.confidence,
    proofStrength: item.proofStrength ?? 50,
    senioritySignal: item.senioritySignal ?? null,
    needsUserConfirmation: item.needsUserConfirmation ?? false,
  };
}

function validateTextLength(value: string, max: number, label: string) {
  if (value.length > max) {
    throw new Error(`${label} is too long. Keep it under ${max.toLocaleString()} characters for this MVP.`);
  }
}

function retrievalQuery(parsedJob: ParsedJobContext) {
  return [
    parsedJob.targetRole,
    parsedJob.targetCompany,
    parsedJob.seniorityLevel,
    parsedJob.requirements.join(", "),
    parsedJob.keywords.join(", "),
    parsedJob.responsibilities.join(" "),
    parsedJob.mustHaveSkills.join(", "),
    parsedJob.niceToHaveSkills.join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

async function ensureSession(input: {
  clerkUserId: string;
  sessionId?: string | null;
  anonymousSessionId?: string | null;
  targetRoleRaw: string;
  cvMode: CvMode;
}) {
  if (input.sessionId) {
    const ownershipFilters: Prisma.ApplicationSessionWhereInput[] = [
      {
        clerkUserId: input.clerkUserId,
      },
    ];

    if (input.anonymousSessionId) {
      ownershipFilters.push({
        clerkUserId: null,
        anonymousSessionId: input.anonymousSessionId,
      });
    }

    const session = await prismadb.applicationSession.findFirst({
      where: {
        id: input.sessionId,
        OR: ownershipFilters,
      },
    });

    if (!session) {
      throw new Error("ProofCV session was not found for this user.");
    }

    return prismadb.applicationSession.update({
      where: {
        id: input.sessionId,
      },
      data: {
        clerkUserId: input.clerkUserId,
        anonymousSessionId: input.anonymousSessionId || undefined,
        targetRoleRaw: input.targetRoleRaw,
        cvMode: toDbCvMode(input.cvMode),
        status: toDbStatus("job_context"),
      },
    });
  }

  return prismadb.applicationSession.create({
    data: {
      clerkUserId: input.clerkUserId,
      anonymousSessionId: input.anonymousSessionId || null,
      targetRoleRaw: input.targetRoleRaw,
      cvMode: toDbCvMode(input.cvMode),
      status: toDbStatus("job_context"),
    },
  });
}

export async function createProofCvSession(input: {
  clerkUserId: string;
  anonymousSessionId?: string | null;
  targetRoleRaw: string;
  cvMode: CvMode;
}) {
  const cvMode = cvModeSchema.parse(input.cvMode);

  return ensureSession({
    clerkUserId: input.clerkUserId,
    anonymousSessionId: input.anonymousSessionId,
    targetRoleRaw: input.targetRoleRaw,
    cvMode,
  });
}

async function parseJobContext(input: {
  targetRoleRaw: string;
  jobDescription: string;
  specificity: ParsedJobContext["specificity"];
}) {
  if (proofCvConfig.mockAI) {
    return mockParsedJob(input.targetRoleRaw, input.specificity);
  }

  return generateProofJson({
    tier: "fast",
    schema: parsedJobContextSchema,
    system: intakeSystemPrompt,
    user: `Parse the target job for ProofCV.

Target role:
${input.targetRoleRaw}

Specificity:
${input.specificity}

Job description or extracted screenshot text:
${input.jobDescription || "No exact job description supplied. Infer cautiously and keep role-only specificity."}

Return JSON matching the requested schema. Do not invent a specific employer if it is not present.`,
  });
}

async function extractEvidence(input: {
  targetRoleRaw: string;
  source: ProofCvEvidenceItem["source"];
  text: string;
}): Promise<ProofCvEvidenceItem[]> {
  if (proofCvConfig.mockAI) {
    return mockEvidenceItems(input);
  }

  const result = await generateProofJson({
    tier: "fast",
    schema: evidenceItemsResponseSchema,
    system: intakeSystemPrompt,
    user: `Extract reusable EvidenceItems for ProofCV.

Target role:
${input.targetRoleRaw}

Source:
${input.source}

User text:
${input.text}

Return small, reusable EvidenceItems. Do not summarize into one profile. Mark uncertain claims as needs_confirmation.`,
  });

  return result.evidenceItems.map(normalizeEvidenceItem);
}

async function generateFollowUps(input: {
  targetRoleRaw: string;
  parsedJob: ParsedJobContext;
  evidenceItems: Array<ProofCvEvidenceItem & { id: string }>;
}) {
  if (proofCvConfig.mockAI) {
    return mockFollowUpQuestions(input.targetRoleRaw);
  }

  const result = await generateProofJson({
    tier: "fast",
    schema: followUpResponseSchema,
    system: intakeSystemPrompt,
    user: `Generate 3-5 high-value follow-up questions for a tailored CV.

Target role:
${input.targetRoleRaw}

Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Current EvidenceItems:
${JSON.stringify(input.evidenceItems, null, 2)}

Ask only questions that improve the CV. Avoid generic strengths, personality, and five-year-plan questions.`,
  });

  return result.questions;
}

export async function prepareFollowups(input: {
  clerkUserId: string;
  sessionId?: string | null;
  anonymousSessionId?: string | null;
  targetRoleRaw: string;
  cvMode: CvMode;
  jobDescription: string;
  jobContextMode: "paste" | "screenshot" | "role_only";
  brainDump: string;
  cvText: string;
  screenshotMeta?: {
    name: string;
    type: string;
  } | null;
}): Promise<PrepareFollowupsResponse> {
  validateTextLength(input.jobDescription, MAX_JOB_DESCRIPTION_CHARS, "The pasted job description");
  validateTextLength(input.brainDump, MAX_BRAIN_DUMP_CHARS, "Your brain dump");

  const session = await ensureSession({
    clerkUserId: input.clerkUserId,
    sessionId: input.sessionId,
    anonymousSessionId: input.anonymousSessionId,
    targetRoleRaw: input.targetRoleRaw,
    cvMode: input.cvMode,
  });

  await prismadb.applicationSession.update({
    where: {
      id: session.id,
    },
    data: {
      status: toDbStatus("processing_context"),
    },
  });

  const specificity = input.jobContextMode === "role_only" ? "role_only" : input.jobContextMode === "screenshot" ? "screenshot" : "job_description";
  const parsedJob = await parseJobContext({
    targetRoleRaw: input.targetRoleRaw,
    jobDescription: input.jobDescription,
    specificity,
  });

  await prismadb.applicationSession.update({
    where: {
      id: session.id,
    },
    data: {
      targetCompany: parsedJob.targetCompany,
      targetRole: parsedJob.targetRole,
    },
  });

  await prismadb.jobContext.upsert({
    where: {
      sessionId: session.id,
    },
    create: {
      sessionId: session.id,
      clerkUserId: input.clerkUserId,
      originalRoleText: input.targetRoleRaw,
      pastedJobDescription: input.jobDescription || null,
      uploadedScreenshotName: input.screenshotMeta?.name || null,
      uploadedScreenshotContentType: input.screenshotMeta?.type || null,
      parsedRequirements: parsedJob.requirements,
      parsedKeywords: parsedJob.keywords,
      seniorityLevel: parsedJob.seniorityLevel,
      responsibilities: parsedJob.responsibilities,
      companyTone: parsedJob.companyTone,
      mustHaveSkills: parsedJob.mustHaveSkills,
      niceToHaveSkills: parsedJob.niceToHaveSkills,
    },
    update: {
      originalRoleText: input.targetRoleRaw,
      pastedJobDescription: input.jobDescription || null,
      uploadedScreenshotName: input.screenshotMeta?.name || null,
      uploadedScreenshotContentType: input.screenshotMeta?.type || null,
      parsedRequirements: parsedJob.requirements,
      parsedKeywords: parsedJob.keywords,
      seniorityLevel: parsedJob.seniorityLevel,
      responsibilities: parsedJob.responsibilities,
      companyTone: parsedJob.companyTone,
      mustHaveSkills: parsedJob.mustHaveSkills,
      niceToHaveSkills: parsedJob.niceToHaveSkills,
    },
  });

  const evidenceText = input.cvMode === "existing_cv" ? input.cvText : input.brainDump;
  const evidenceSource = input.cvMode === "existing_cv" ? "uploaded_cv" : "user_brain_dump";
  const extracted = evidenceText.trim()
    ? await extractEvidence({
        targetRoleRaw: input.targetRoleRaw,
        source: evidenceSource,
        text: evidenceText,
      })
    : mockEvidenceItems({
        targetRoleRaw: input.targetRoleRaw,
        source: evidenceSource,
        text: "",
      });

  const evidenceItems = await storeEvidenceItems({
    clerkUserId: input.clerkUserId,
    sessionId: session.id,
    items: extracted,
  });

  const retrieval = await retrieveRelevantEvidence({
    clerkUserId: input.clerkUserId,
    sessionId: session.id,
    query: retrievalQuery(parsedJob),
    limit: 8,
  });

  const followUpQuestions = await generateFollowUps({
    targetRoleRaw: input.targetRoleRaw,
    parsedJob,
    evidenceItems,
  });

  await prismadb.applicationSession.update({
    where: {
      id: session.id,
    },
    data: {
      status: toDbStatus("ai_followup_questions"),
    },
  });

  return {
    sessionId: session.id,
    parsedJob,
    evidenceItems,
    retrieval,
    followUpQuestions,
  };
}

export async function createJobFitPlan(input: {
  clerkUserId: string;
  sessionId: string;
  targetRoleRaw: string;
  followupAnswers: Array<{ question: string; answer: string }>;
}): Promise<CreatePlanResponse> {
  const session = await prismadb.applicationSession.findFirst({
    where: {
      id: input.sessionId,
      clerkUserId: input.clerkUserId,
    },
    include: {
      jobContext: true,
    },
  });

  if (!session?.jobContext) {
    throw new Error("ProofCV session was not found. Start again from the role input.");
  }

  const followupText = input.followupAnswers
    .filter((item) => item.answer.trim())
    .map((item) => `Question: ${item.question}\nAnswer: ${item.answer}`)
    .join("\n\n");

  if (followupText) {
    const followupEvidence = await extractEvidence({
      targetRoleRaw: input.targetRoleRaw,
      source: "followup_answer",
      text: followupText,
    });

    await storeEvidenceItems({
      clerkUserId: input.clerkUserId,
      sessionId: input.sessionId,
      items: followupEvidence,
    });
  }

  const parsedJob: ParsedJobContext = {
    targetCompany: session.targetCompany,
    targetRole: session.targetRole || session.targetRoleRaw,
    seniorityLevel: session.jobContext.seniorityLevel,
    requirements: Array.isArray(session.jobContext.parsedRequirements) ? (session.jobContext.parsedRequirements as string[]) : [],
    keywords: Array.isArray(session.jobContext.parsedKeywords) ? (session.jobContext.parsedKeywords as string[]) : [],
    responsibilities: Array.isArray(session.jobContext.responsibilities) ? (session.jobContext.responsibilities as string[]) : [],
    companyTone: session.jobContext.companyTone,
    mustHaveSkills: Array.isArray(session.jobContext.mustHaveSkills) ? (session.jobContext.mustHaveSkills as string[]) : [],
    niceToHaveSkills: Array.isArray(session.jobContext.niceToHaveSkills) ? (session.jobContext.niceToHaveSkills as string[]) : [],
    specificity: session.jobContext.pastedJobDescription ? "job_description" : session.jobContext.uploadedScreenshotName ? "screenshot" : "role_only",
  };

  const retrieval = await retrieveRelevantEvidence({
    clerkUserId: input.clerkUserId,
    sessionId: input.sessionId,
    query: retrievalQuery(parsedJob),
    limit: 8,
  });

  let plan: JobFitPlan;

  if (proofCvConfig.mockAI) {
    plan = mockJobFitPlan(input.targetRoleRaw, retrieval.items.map((item) => item.title));
  } else {
    plan = await generateProofJson({
      tier: "best",
      schema: jobFitPlanSchema,
      system: planSystemPrompt,
      user: `Create the ProofCV Job Fit Plan.

Parsed job:
${JSON.stringify(parsedJob, null, 2)}

Retrieved EvidenceItems:
${JSON.stringify(retrieval.items, null, 2)}

Follow-up answers:
${followupText || "No follow-up answers supplied."}`,
    });
  }

  await prismadb.applicationSession.update({
    where: {
      id: input.sessionId,
    },
    data: {
      status: toDbStatus("job_fit_plan"),
    },
  });

  return {
    sessionId: input.sessionId,
    plan,
    retrieval,
  };
}

export async function generateTailoredCvArtifact(input: {
  clerkUserId: string;
  sessionId: string;
  targetRoleRaw: string;
  plan: JobFitPlan;
}): Promise<GenerateCvResponse> {
  const retrieval = await retrieveRelevantEvidence({
    clerkUserId: input.clerkUserId,
    sessionId: input.sessionId,
    query: `${input.targetRoleRaw}\n${input.plan.caresAbout.join("\n")}\n${input.plan.strategy}`,
    limit: 10,
  });

  await prismadb.applicationSession.update({
    where: {
      id: input.sessionId,
    },
    data: {
      status: toDbStatus("generating_cv"),
    },
  });

  let cv: TailoredCv;

  if (proofCvConfig.mockAI) {
    cv = mockTailoredCv({
      targetRoleRaw: input.targetRoleRaw,
      plan: input.plan,
      evidenceItems: retrieval.items,
    });
  } else {
    cv = await generateProofJson({
      tier: "best",
      schema: tailoredCvSchema,
      system: cvWriterSystemPrompt,
      user: `Write a one-page tailored CV for ProofCV.

Target:
${input.targetRoleRaw}

Job Fit Plan:
${JSON.stringify(input.plan, null, 2)}

Retrieved EvidenceItems:
${JSON.stringify(retrieval.items, null, 2)}

Use placeholders for missing contact details and include an evidenceMap from each bullet or claim to EvidenceItem IDs.`,
    });
  }

  const verification = proofCvConfig.mockAI
    ? mockVerification(cv)
    : await generateProofJson({
        tier: "fast",
        schema: verificationReportSchema,
        system: verifierSystemPrompt,
        user: `Verify this generated CV against the Evidence Vault.

EvidenceItems:
${JSON.stringify(retrieval.items, null, 2)}

CV:
${JSON.stringify(cv, null, 2)}`,
      });

  const artifact = await prismadb.cvArtifact.create({
    data: {
      clerkUserId: input.clerkUserId,
      sessionId: input.sessionId,
      jobFitPlan: input.plan,
      cvSections: cv,
      atsText: cv.atsText,
      verificationReport: verification,
      evidenceMap: cv.evidenceMap,
    },
  });

  await prismadb.applicationSession.update({
    where: {
      id: input.sessionId,
    },
    data: {
      status: toDbStatus("cv_editor"),
    },
  });

  return generateCvResponseSchema.parse({
    sessionId: input.sessionId,
    artifactId: artifact.id,
    cv,
    verification,
  });
}

export async function editTailoredCv(input: {
  clerkUserId: string;
  sessionId: string;
  artifactId: string;
  instruction: string;
  currentCv: TailoredCv;
}): Promise<EditCvResponse> {
  const majorRewrite = /\brewrite\b|\breposition\b|\brework\b|\bchange the whole\b|\bnew version\b/i.test(input.instruction);
  const tier = majorRewrite ? "best" : "fast";

  const retrieval = await retrieveRelevantEvidence({
    clerkUserId: input.clerkUserId,
    sessionId: input.sessionId,
    query: `${input.instruction}\n${input.currentCv.atsText}`,
    limit: 10,
  });

  const cv = proofCvConfig.mockAI
    ? {
        ...input.currentCv,
        sections: input.currentCv.sections.map((section, index) =>
          index === 0
            ? {
                ...section,
                content: [...section.content, `Edit applied: ${input.instruction}`],
              }
            : section
        ),
        atsText: `${input.currentCv.atsText}\n\nEdit applied: ${input.instruction}`,
      }
    : await generateProofJson({
        tier,
        schema: tailoredCvSchema,
        system: cvEditorSystemPrompt,
        user: `Edit this ProofCV CV.

Instruction:
${input.instruction}

Current CV:
${JSON.stringify(input.currentCv, null, 2)}

EvidenceItems:
${JSON.stringify(retrieval.items, null, 2)}

Return the complete updated CV structure with evidenceMap preserved or updated.`,
      });

  const verification = proofCvConfig.mockAI
    ? mockVerification(cv)
    : await generateProofJson({
        tier: "fast",
        schema: verificationReportSchema,
        system: verifierSystemPrompt,
        user: `Verify the edited CV against the Evidence Vault.

EvidenceItems:
${JSON.stringify(retrieval.items, null, 2)}

CV:
${JSON.stringify(cv, null, 2)}`,
      });

  await prismadb.cvArtifact.updateMany({
    where: {
      id: input.artifactId,
      sessionId: input.sessionId,
      clerkUserId: input.clerkUserId,
    },
    data: {
      cvSections: cv,
      atsText: cv.atsText,
      verificationReport: verification,
      evidenceMap: cv.evidenceMap,
    },
  });

  return editCvResponseSchema.parse({
    cv,
    verification,
    modelTier: tier,
  });
}
