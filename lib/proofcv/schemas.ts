import { z } from "zod";

export const workflowStates = [
  "landing",
  "auth_gate",
  "job_context",
  "cv_or_profile_context",
  "processing_context",
  "ai_followup_questions",
  "job_fit_plan",
  "generating_cv",
  "cv_editor",
  "export_ready",
] as const;

export const cvModes = ["scratch", "existing_cv"] as const;

export const MAX_CV_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_SCREENSHOT_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_JOB_DESCRIPTION_CHARS = 24_000;
export const MAX_BRAIN_DUMP_CHARS = 16_000;

export type WorkflowState = (typeof workflowStates)[number];
export type CvMode = (typeof cvModes)[number];

export const cvModeSchema = z.enum(cvModes);

export const pendingSessionSchema = z.object({
  id: z.string().min(1),
  targetRoleRaw: z.string().min(1),
  cvMode: cvModeSchema,
  cvFileMeta: z
    .object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
    })
    .nullable(),
  createdAt: z.string(),
});

export type PendingSession = z.infer<typeof pendingSessionSchema>;

export const parsedJobContextSchema = z.object({
  targetCompany: z.string().nullable(),
  targetRole: z.string(),
  seniorityLevel: z.string().nullable(),
  requirements: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  companyTone: z.string().nullable(),
  mustHaveSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  specificity: z.enum(["role_only", "job_description", "screenshot"]),
});

export type ParsedJobContext = z.infer<typeof parsedJobContextSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "project",
    "skill",
    "work_experience",
    "education",
    "certification",
    "achievement",
    "tool",
    "goal",
  ]),
  title: z.string(),
  description: z.string(),
  tools: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  impact: z.string().nullable().default(null),
  source: z.enum(["uploaded_cv", "user_brain_dump", "followup_answer", "generated_correction"]),
  confidence: z.enum(["confirmed", "inferred", "needs_confirmation"]),
  proofStrength: z.number().min(0).max(100).default(50),
  senioritySignal: z.string().nullable().default(null),
  needsUserConfirmation: z.boolean().default(false),
});

type EvidenceItemSchemaOutput = z.infer<typeof evidenceItemSchema>;
export type ProofCvEvidenceItem = Omit<Required<EvidenceItemSchemaOutput>, "id"> & {
  id?: string;
};

export const retrievalResultSchema = z.object({
  mode: z.enum(["embedding", "keyword"]),
  label: z.string(),
  items: z.array(
    evidenceItemSchema.extend({
      id: z.string(),
      score: z.number(),
    })
  ),
});

export type RetrievalResult = z.infer<typeof retrievalResultSchema>;

export const followUpQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  rationale: z.string(),
});

export type FollowUpQuestion = z.infer<typeof followUpQuestionSchema>;

export const jobFitPlanSchema = z.object({
  target: z.string(),
  caresAbout: z.array(z.string()),
  strongestEvidence: z.array(z.string()),
  gapsAndRisks: z.array(z.string()),
  strategy: z.string(),
});

export type JobFitPlan = z.infer<typeof jobFitPlanSchema>;

export const cvSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.array(z.string()),
});

export const tailoredCvSchema = z.object({
  header: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    links: z.string(),
  }),
  sections: z.array(cvSectionSchema),
  atsText: z.string(),
  evidenceMap: z.record(z.array(z.string())),
});

export type TailoredCv = z.infer<typeof tailoredCvSchema>;

export const verificationReportSchema = z.object({
  supported: z.array(z.string()),
  needsConfirmation: z.array(z.string()),
  rewritten: z.array(
    z.object({
      original: z.string(),
      rewrite: z.string(),
    })
  ),
});

export type VerificationReport = z.infer<typeof verificationReportSchema>;

export const prepareFollowupsResponseSchema = z.object({
  sessionId: z.string(),
  parsedJob: parsedJobContextSchema,
  evidenceItems: z.array(evidenceItemSchema.extend({ id: z.string() })),
  retrieval: retrievalResultSchema,
  followUpQuestions: z.array(followUpQuestionSchema).min(3).max(5),
});

export type PrepareFollowupsResponse = z.infer<typeof prepareFollowupsResponseSchema>;

export const createPlanResponseSchema = z.object({
  sessionId: z.string(),
  plan: jobFitPlanSchema,
  retrieval: retrievalResultSchema,
});

export type CreatePlanResponse = z.infer<typeof createPlanResponseSchema>;

export const generateCvResponseSchema = z.object({
  sessionId: z.string(),
  artifactId: z.string(),
  cv: tailoredCvSchema,
  verification: verificationReportSchema,
});

export type GenerateCvResponse = z.infer<typeof generateCvResponseSchema>;

export const editCvResponseSchema = z.object({
  cv: tailoredCvSchema,
  verification: verificationReportSchema,
  modelTier: z.enum(["fast", "best"]),
});

export type EditCvResponse = z.infer<typeof editCvResponseSchema>;
