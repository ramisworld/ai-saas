import type { CareerInput } from "@/lib/job-agent/types";

const MAX_CHUNK_LENGTH = 1400;
const CHUNK_OVERLAP = 180;

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function chunkCareerSource(source: CareerInput) {
  const text = normalizeText(source.text);

  if (!text) {
    return [];
  }

  const paragraphs = text.split(/\n\s*\n/g).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= MAX_CHUNK_LENGTH) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length <= MAX_CHUNK_LENGTH) {
      current = paragraph;
      continue;
    }

    for (let index = 0; index < paragraph.length; index += MAX_CHUNK_LENGTH - CHUNK_OVERLAP) {
      chunks.push(paragraph.slice(index, index + MAX_CHUNK_LENGTH).trim());
    }

    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 40);
}
