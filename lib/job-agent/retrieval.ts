import type { CareerSourceType } from "@prisma/client";

import prismadb from "@/lib/prismadb";
import { chunkCareerSource } from "@/lib/job-agent/chunking";
import { generateEmbedding } from "@/lib/job-agent/ai";
import type { CareerEvidence, CareerInput } from "@/lib/job-agent/types";

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

export async function embedAndStoreCareerSource(input: {
  userId: string;
  vaultId: string;
  source: CareerInput;
}) {
  const source = await prismadb.careerSource.create({
    data: {
      userId: input.userId,
      vaultId: input.vaultId,
      type: input.source.type,
      title: input.source.title,
      originalText: input.source.text,
      metadata: input.source.metadata,
    },
  });

  const chunks = chunkCareerSource(input.source);

  for (const [index, text] of chunks.entries()) {
    const embedding = await generateEmbedding(text);

    await prismadb.careerChunk.create({
      data: {
        userId: input.userId,
        vaultId: input.vaultId,
        sourceId: source.id,
        sourceType: input.source.type,
        title: input.source.title,
        text,
        embedding,
        metadata: {
          chunkIndex: index,
        },
      },
    });
  }

  return {
    source,
    chunkCount: chunks.length,
  };
}

export async function retrieveCareerChunks(input: {
  userId: string;
  query: string;
  limit?: number;
  sourceTypes?: CareerSourceType[];
}): Promise<CareerEvidence[]> {
  const queryEmbedding = await generateEmbedding(input.query);
  const chunks = await prismadb.careerChunk.findMany({
    where: {
      userId: input.userId,
      sourceType: input.sourceTypes?.length
        ? {
            in: input.sourceTypes,
          }
        : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 250,
  });

  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, toNumberArray(chunk.embedding)),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit || 8)
    .map(({ chunk, score }) => ({
      chunkId: chunk.id,
      sourceId: chunk.sourceId,
      sourceType: chunk.sourceType,
      title: chunk.title,
      text: chunk.text,
      score,
    }));
}
