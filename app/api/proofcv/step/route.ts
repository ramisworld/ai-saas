import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { proofCvApiErrorResponse } from "@/lib/proofcv/api-errors";
import { extractTextFromImage, proofCvConfig } from "@/lib/proofcv/ai";
import { extractTextFromProofCvUpload } from "@/lib/proofcv/file-parser";
import {
  createJobFitPlan,
  editTailoredCv,
  generateTailoredCvArtifact,
  prepareFollowups,
} from "@/lib/proofcv/orchestrator";
import {
  cvModeSchema,
  MAX_BRAIN_DUMP_CHARS,
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_SCREENSHOT_UPLOAD_BYTES,
  tailoredCvSchema,
} from "@/lib/proofcv/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function screenshotToText(file: File) {
  if (!file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Upload a PNG, JPG, or WebP screenshot of the job post.");
  }

  if (file.size > MAX_SCREENSHOT_UPLOAD_BYTES) {
    throw new Error("The screenshot is too large. Upload an image under 5MB.");
  }

  if (proofCvConfig.mockAI) {
    return "Mock screenshot text: job listing screenshot attached for ProofCV parsing.";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  return extractTextFromImage({
    dataUrl,
    prompt:
      "Extract the job title, company, responsibilities, required skills, nice-to-have skills, seniority, and tone from this job listing screenshot. Return concise plain text.",
  });
}

const createPlanSchema = z.object({
  action: z.literal("create_plan"),
  sessionId: z.string().min(1),
  targetRoleRaw: z.string().min(1),
  followupAnswers: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

const generateCvSchema = z.object({
  action: z.literal("generate_cv"),
  sessionId: z.string().min(1),
  targetRoleRaw: z.string().min(1),
  plan: z.any(),
});

const editCvSchema = z.object({
  action: z.literal("edit_cv"),
  sessionId: z.string().min(1),
  artifactId: z.string().min(1),
  instruction: z.string().min(1),
  currentCv: tailoredCvSchema,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse("Create your free account so ProofCV can save your Career Vault.", 401);
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = textValue(formData, "action");

      if (action !== "prepare_followups") {
        return errorResponse("Unsupported ProofCV form action.");
      }

      const targetRoleRaw = textValue(formData, "targetRoleRaw");
      const cvMode = cvModeSchema.parse(textValue(formData, "cvMode") || "scratch");
      const jobDescription = textValue(formData, "jobDescription");
      const brainDump = textValue(formData, "brainDump");
      const jobContextMode = (textValue(formData, "jobContextMode") || "role_only") as "paste" | "screenshot" | "role_only";
      const cvFile = formData.get("cvFile");
      const screenshotFile = formData.get("screenshotFile");

      if (!targetRoleRaw) {
        return errorResponse("Describe the role you want first.");
      }

      if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
        return errorResponse(`The pasted job description is too long. Keep it under ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`);
      }

      if (brainDump.length > MAX_BRAIN_DUMP_CHARS) {
        return errorResponse(`Your brain dump is too long. Keep it under ${MAX_BRAIN_DUMP_CHARS.toLocaleString()} characters.`);
      }

      let cvText = "";

      if (cvFile instanceof File && cvFile.size > 0) {
        cvText = await extractTextFromProofCvUpload(cvFile);
      }

      if (cvMode === "existing_cv" && !cvText) {
        return errorResponse("Attach your CV as a PDF/DOCX or switch to Start from scratch.");
      }

      let screenshotText = "";
      let screenshotMeta = null;

      if (screenshotFile instanceof File && screenshotFile.size > 0) {
        screenshotText = await screenshotToText(screenshotFile);
        screenshotMeta = {
          name: screenshotFile.name,
          type: screenshotFile.type,
        };
      }

      const combinedJobDescription = [jobDescription, screenshotText].filter(Boolean).join("\n\n");

      if (combinedJobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
        return errorResponse(`The job context is too long after screenshot extraction. Keep it under ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`);
      }

      const response = await prepareFollowups({
        clerkUserId: userId,
        sessionId: textValue(formData, "sessionId") || null,
        anonymousSessionId: textValue(formData, "anonymousSessionId") || null,
        targetRoleRaw,
        cvMode,
        jobDescription: combinedJobDescription,
        jobContextMode,
        brainDump,
        cvText,
        screenshotMeta,
      });

      return NextResponse.json(response);
    }

    const json = await req.json();

    if (json.action === "create_plan") {
      const parsed = createPlanSchema.parse(json);
      const response = await createJobFitPlan({
        clerkUserId: userId,
        sessionId: parsed.sessionId,
        targetRoleRaw: parsed.targetRoleRaw,
        followupAnswers: parsed.followupAnswers,
      });

      return NextResponse.json(response);
    }

    if (json.action === "generate_cv") {
      const parsed = generateCvSchema.parse(json);
      const response = await generateTailoredCvArtifact({
        clerkUserId: userId,
        sessionId: parsed.sessionId,
        targetRoleRaw: parsed.targetRoleRaw,
        plan: parsed.plan,
      });

      return NextResponse.json(response);
    }

    if (json.action === "edit_cv") {
      const parsed = editCvSchema.parse(json);
      const response = await editTailoredCv({
        clerkUserId: userId,
        sessionId: parsed.sessionId,
        artifactId: parsed.artifactId,
        instruction: parsed.instruction,
        currentCv: parsed.currentCv,
      });

      return NextResponse.json(response);
    }

    return errorResponse("Unsupported ProofCV action.");
  } catch (error) {
    return proofCvApiErrorResponse(error);
  }
}
