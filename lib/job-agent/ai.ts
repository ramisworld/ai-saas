import OpenAI from "openai";

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIModelError";
  }
}

export const aiConfig = {
  textModel: process.env.BEST_MODEL || process.env.AI_TEXT_MODEL || "",
  fastModel:
    process.env.FAST_MODEL ||
    process.env.AI_FAST_MODEL ||
    process.env.AI_TEXT_MODEL ||
    process.env.BEST_MODEL ||
    "",
  embeddingModel: process.env.EMBEDDING_MODEL || process.env.AI_EMBEDDING_MODEL || "",
};

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AIConfigurationError(
      "OpenAI is not configured. Add OPENAI_API_KEY to generate application packs."
    );
  }

  if (!aiConfig.textModel || !aiConfig.fastModel || !aiConfig.embeddingModel) {
    throw new AIConfigurationError(
      "AI models are not configured. Set FAST_MODEL, BEST_MODEL, and EMBEDDING_MODEL, or provide the existing AI_* fallbacks."
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "The AI request failed.";
}

export function normalizeAIError(error: unknown) {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("model") &&
    (lower.includes("not found") || lower.includes("does not exist") || lower.includes("invalid"))
  ) {
    return new AIModelError(
      `The configured AI model is unavailable. Check AI_TEXT_MODEL, AI_FAST_MODEL, and AI_EMBEDDING_MODEL. Provider message: ${message}`
    );
  }

  if (lower.includes("api key") || lower.includes("authentication")) {
    return new AIConfigurationError(
      "OpenAI authentication failed. Check OPENAI_API_KEY on the server."
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export function extractJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new AIModelError("The AI response was not valid JSON.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as unknown;
}

export async function generateJson<T>({
  system,
  user,
  model = aiConfig.fastModel,
}: {
  system: string;
  user: string;
  model?: string;
}): Promise<T> {
  try {
    const openai = getOpenAIClient();
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
      throw new AIModelError("The AI provider returned an empty response.");
    }

    return extractJsonObject(content) as T;
  } catch (error) {
    throw normalizeAIError(error);
  }
}

export async function generateText({
  system,
  user,
  model = aiConfig.textModel,
}: {
  system: string;
  user: string;
  model?: string;
}) {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new AIModelError("The AI provider returned an empty response.");
    }

    return content.trim();
  } catch (error) {
    throw normalizeAIError(error);
  }
}

export async function generateEmbedding(input: string) {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: aiConfig.embeddingModel,
      input: input.slice(0, 12000),
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding?.length) {
      throw new AIModelError("The AI provider returned an empty embedding.");
    }

    return embedding;
  } catch (error) {
    throw normalizeAIError(error);
  }
}
