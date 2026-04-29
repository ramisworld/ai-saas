import OpenAI from "openai";
import type { z } from "zod";

export class ProofCvAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProofCvAIConfigurationError";
  }
}

export class ProofCvAIModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProofCvAIModelError";
  }
}

export const proofCvConfig = {
  mockAI: process.env.PROOFCV_MOCK_AI === "true",
  fastModel: process.env.FAST_MODEL || process.env.AI_FAST_MODEL || process.env.AI_TEXT_MODEL || "",
  bestModel: process.env.BEST_MODEL || process.env.AI_TEXT_MODEL || process.env.AI_FAST_MODEL || "",
  embeddingModel: process.env.EMBEDDING_MODEL || process.env.AI_EMBEDDING_MODEL || "",
};

export function getProofCvClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new ProofCvAIConfigurationError(
      "OpenAI is not configured. Add OPENAI_API_KEY or set PROOFCV_MOCK_AI=true for local ProofCV testing."
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function requireModel(model: string, envName: string) {
  if (!model) {
    throw new ProofCvAIConfigurationError(
      `ProofCV ${envName} is not configured. Set ${envName}, use an existing AI_* fallback, or set PROOFCV_MOCK_AI=true.`
    );
  }

  return model;
}

function extractJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace <= firstBrace) {
    throw new ProofCvAIModelError("The AI response was not valid JSON.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as unknown;
}

export async function generateProofJson<T>({
  system,
  user,
  schema,
  tier,
}: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  tier: "fast" | "best";
}) {
  const model = tier === "fast" ? requireModel(proofCvConfig.fastModel, "FAST_MODEL") : requireModel(proofCvConfig.bestModel, "BEST_MODEL");
  const openai = getProofCvClient();
  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new ProofCvAIModelError("The AI provider returned an empty response.");
  }

  const parsed = schema.safeParse(extractJsonObject(content));

  if (!parsed.success) {
    throw new ProofCvAIModelError(`The AI response did not match the expected ProofCV schema: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function generateProofEmbedding(input: string) {
  const model = requireModel(proofCvConfig.embeddingModel, "EMBEDDING_MODEL");
  const openai = getProofCvClient();
  const response = await openai.embeddings.create({
    model,
    input: input.slice(0, 12_000),
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding?.length) {
    throw new ProofCvAIModelError("The AI provider returned an empty embedding.");
  }

  return embedding;
}

export async function extractTextFromImage(input: {
  dataUrl: string;
  prompt: string;
}) {
  const model = requireModel(proofCvConfig.fastModel, "FAST_MODEL");
  const openai = getProofCvClient();
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: input.prompt,
          },
          {
            type: "input_image",
            image_url: input.dataUrl,
            detail: "auto",
          },
        ],
      },
    ],
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new ProofCvAIModelError("The AI provider could not extract text from the screenshot.");
  }

  return text;
}
