import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { AIConfigurationError, AIModelError } from "@/lib/job-agent/ai";
import { extractTextFromUpload } from "@/lib/job-agent/file-parser";
import { runApplicationWorkflow } from "@/lib/job-agent/workflow";

export const runtime = "nodejs";
export const maxDuration = 120;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse("Sign in to generate an application pack.", 401);
    }

    const formData = await req.formData();
    const targetRole = textValue(formData, "targetRole");
    const jobText = textValue(formData, "jobText");
    const jobUrl = textValue(formData, "jobUrl");
    const profileText = textValue(formData, "profileText");
    const cvPastedText = textValue(formData, "cvText");
    const file = formData.get("cvFile");

    if (!targetRole) {
      return errorResponse("Tell ProofCV the role you want to land.");
    }

    if (!profileText && !cvPastedText && !(file instanceof File && file.size > 0)) {
      return errorResponse("Add your CV, profile notes, or career context before generating a pack.");
    }

    let uploadedCvText = "";

    if (file instanceof File && file.size > 0) {
      uploadedCvText = await extractTextFromUpload(file);
    }

    const result = await runApplicationWorkflow({
      userId,
      targetRole,
      jobText,
      jobUrl,
      profileText,
      cvText: [cvPastedText, uploadedCvText].filter(Boolean).join("\n\n"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AIConfigurationError || error instanceof AIModelError) {
      return errorResponse(error.message, 500);
    }

    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Application pack generation failed.", 500);
  }
}
