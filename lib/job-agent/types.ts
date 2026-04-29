import type {
  ApplicationDocumentType,
  CareerSourceType,
  Prisma,
  TrackerStatus,
  UsageType,
} from "@prisma/client";

export type JsonRecord = Prisma.InputJsonObject;

export type ParsedJob = {
  company: string | null;
  roleTitle: string;
  seniority: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  atsKeywords: string[];
  interviewThemes: string[];
  hiddenExpectations: string[];
  confidence: number;
};

export type CareerProfile = {
  summary: string;
  currentRole: string | null;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    outcomes: string[];
  }>;
  experience: Array<{
    role: string;
    company: string | null;
    highlights: string[];
  }>;
  education: string[];
  certifications: string[];
  achievements: string[];
  goals: string[];
};

export type CareerInput = {
  title: string;
  type: CareerSourceType;
  text: string;
  metadata?: JsonRecord;
};

export type CareerEvidence = {
  chunkId: string;
  sourceId: string | null;
  sourceType: CareerSourceType | null;
  title: string | null;
  text: string;
  score: number;
};

export type MatchAnalysis = {
  matchScore: number;
  strongMatches: string[];
  weakSpots: string[];
  missingSkills: string[];
  suggestedEmphasis: string[];
  reasoning: string;
};

export type GeneratedDocuments = {
  tailoredCv: string;
  coverLetter: string;
  recruiterMessage: string;
  interviewPrep: string;
};

export type WorkflowProgressStep =
  | "analyzing-job"
  | "creating-vault"
  | "embedding-career"
  | "retrieving-evidence"
  | "calculating-match"
  | "tailoring-cv"
  | "writing-cover-letter"
  | "writing-recruiter-message"
  | "building-interview-prep"
  | "saving-pack";

export type ApplicationWorkflowResult = {
  packId: string;
  trackerEntryId: string;
  jobPostingId: string;
};

export type UsageLimit = {
  allowed: boolean;
  used: number;
  limit: number;
  isPro: boolean;
};

export type DocumentCreateInput = {
  type: ApplicationDocumentType;
  title: string;
  content: string;
  metadata?: JsonRecord;
};

export type TrackerCreateInput = {
  company?: string | null;
  role: string;
  status?: TrackerStatus;
  nextAction?: string | null;
  notes?: string | null;
};

export type UsageRecordInput = {
  type: UsageType;
  amount?: number;
  metadata?: JsonRecord;
};
