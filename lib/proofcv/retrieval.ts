import prismadb from "@/lib/prismadb";
import { generateProofEmbedding, proofCvConfig } from "@/lib/proofcv/ai";
import {
  fromDbEvidenceConfidence,
  fromDbEvidenceSource,
  fromDbEvidenceType,
  toDbEvidenceConfidence,
  toDbEvidenceSource,
  toDbEvidenceType,
} from "@/lib/proofcv/db-mapping";
import type { ProofCvEvidenceItem, RetrievalResult } from "@/lib/proofcv/schemas";

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);

  if (!length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function evidenceText(item: ProofCvEvidenceItem) {
  return [
    item.type,
    item.title,
    item.description,
    item.tools.join(", "),
    item.skills.join(", "),
    item.impact,
    item.senioritySignal,
  ]
    .filter(Boolean)
    .join("\n");
}

function keywordScore(query: string, text: string) {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  if (!words.length) {
    return 0;
  }

  const lowerText = text.toLowerCase();
  const matches = words.filter((word) => lowerText.includes(word)).length;
  return matches / words.length;
}

function fromDbEvidenceItem(item: {
  id: string;
  type: Parameters<typeof fromDbEvidenceType>[0];
  title: string;
  description: string;
  tools: unknown;
  skills: unknown;
  impact: string | null;
  source: Parameters<typeof fromDbEvidenceSource>[0];
  confidence: Parameters<typeof fromDbEvidenceConfidence>[0];
  proofStrength: number;
  senioritySignal: string | null;
  needsUserConfirmation: boolean;
}) {
  const tools = Array.isArray(item.tools) ? item.tools.filter((tool): tool is string => typeof tool === "string") : [];
  const skills = Array.isArray(item.skills) ? item.skills.filter((skill): skill is string => typeof skill === "string") : [];

  return {
    id: item.id,
    type: fromDbEvidenceType(item.type),
    title: item.title,
    description: item.description,
    tools,
    skills,
    impact: item.impact,
    source: fromDbEvidenceSource(item.source),
    confidence: fromDbEvidenceConfidence(item.confidence),
    proofStrength: item.proofStrength,
    senioritySignal: item.senioritySignal,
    needsUserConfirmation: item.needsUserConfirmation,
  };
}

export async function storeEvidenceItems(input: {
  clerkUserId: string;
  sessionId: string;
  items: ProofCvEvidenceItem[];
}) {
  const created = [];

  for (const item of input.items) {
    let embedding: number[] | null = null;

    if (!proofCvConfig.mockAI) {
      try {
        embedding = await generateProofEmbedding(evidenceText(item));
      } catch {
        embedding = null;
      }
    }

    const row = await prismadb.evidenceItem.create({
      data: {
        clerkUserId: input.clerkUserId,
        sessionId: input.sessionId,
        type: toDbEvidenceType(item.type),
        title: item.title,
        description: item.description,
        tools: item.tools,
        skills: item.skills,
        impact: item.impact,
        source: toDbEvidenceSource(item.source),
        confidence: toDbEvidenceConfidence(item.confidence),
        proofStrength: item.proofStrength,
        senioritySignal: item.senioritySignal,
        needsUserConfirmation: item.needsUserConfirmation,
        embedding: embedding ?? undefined,
      },
    });

    created.push({
      ...fromDbEvidenceItem(row),
      embedding,
    });
  }

  return created;
}

export async function retrieveRelevantEvidence(input: {
  clerkUserId: string;
  sessionId: string;
  query: string;
  limit?: number;
}): Promise<RetrievalResult> {
  const rows = await prismadb.evidenceItem.findMany({
    where: {
      clerkUserId: input.clerkUserId,
      OR: [{ sessionId: input.sessionId }, { sessionId: null }],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 300,
  });

  let queryEmbedding: number[] | null = null;

  if (!proofCvConfig.mockAI) {
    try {
      queryEmbedding = await generateProofEmbedding(input.query);
    } catch {
      queryEmbedding = null;
    }
  }

  const canUseEmbedding =
    !!queryEmbedding && rows.some((row) => toNumberArray(row.embedding).length > 0);

  const scored = rows
    .map((row) => {
      const item = fromDbEvidenceItem(row);
      const text = evidenceText(item);
      const score = canUseEmbedding
        ? cosineSimilarity(queryEmbedding || [], toNumberArray(row.embedding))
        : keywordScore(input.query, text);

      return {
        ...item,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit || 8);

  return {
    mode: canUseEmbedding ? "embedding" : "keyword",
    label: canUseEmbedding
      ? "Embedding retrieval: EvidenceItems were ranked by vector similarity."
      : "Keyword retrieval fallback: embeddings were unavailable, so EvidenceItems were ranked by keyword overlap.",
    items: scored,
  };
}
