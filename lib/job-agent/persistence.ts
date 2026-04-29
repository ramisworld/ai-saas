import { ApplicationDocumentType, TrackerStatus } from "@prisma/client";

import prismadb from "@/lib/prismadb";
import type {
  CareerEvidence,
  DocumentCreateInput,
  MatchAnalysis,
  ParsedJob,
  TrackerCreateInput,
} from "@/lib/job-agent/types";

export async function saveApplicationPack(input: {
  userId: string;
  jobPostingId: string;
  parsedJob: ParsedJob;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
  documents: DocumentCreateInput[];
}) {
  return prismadb.applicationPack.create({
    data: {
      userId: input.userId,
      jobPostingId: input.jobPostingId,
      matchScore: input.match.matchScore,
      summary: input.match.reasoning,
      strongMatches: input.match.strongMatches,
      weakSpots: input.match.weakSpots,
      missingSkills: input.match.missingSkills,
      atsKeywords: input.parsedJob.atsKeywords,
      evidence: input.evidence,
      documents: {
        create: [
          {
            userId: input.userId,
            type: ApplicationDocumentType.MATCH_ANALYSIS,
            title: "Match analysis",
            content: JSON.stringify(input.match, null, 2),
          },
          ...input.documents.map((document) => ({
            userId: input.userId,
            type: document.type,
            title: document.title,
            content: document.content,
            metadata: document.metadata,
          })),
        ],
      },
    },
    include: {
      documents: true,
    },
  });
}

export async function createTrackerEntry(input: {
  userId: string;
  jobPostingId: string;
  applicationPackId: string;
  tracker: TrackerCreateInput;
}) {
  return prismadb.applicationTrackerEntry.create({
    data: {
      userId: input.userId,
      jobPostingId: input.jobPostingId,
      applicationPackId: input.applicationPackId,
      company: input.tracker.company,
      role: input.tracker.role,
      status: input.tracker.status || TrackerStatus.DRAFT_READY,
      nextAction: input.tracker.nextAction || "Review tailored documents before applying",
      notes:
        input.tracker.notes ||
        "Review before sending. ProofCV helps draft and tailor your application but does not guarantee interviews or submit applications for you.",
    },
  });
}
