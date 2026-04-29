import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { proofCvApiErrorResponse } from "@/lib/proofcv/api-errors";
import { createProofCvSession } from "@/lib/proofcv/orchestrator";
import { cvModeSchema } from "@/lib/proofcv/schemas";

const createSessionSchema = z.object({
  anonymousSessionId: z.string().optional().nullable(),
  targetRoleRaw: z.string().min(1, "Describe the role first."),
  cvMode: cvModeSchema,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Sign in to save your Career Vault." }, { status: 401 });
    }

    const parsed = createSessionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid ProofCV session." }, { status: 400 });
    }

    const session = await createProofCvSession({
      clerkUserId: userId,
      ...parsed.data,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return proofCvApiErrorResponse(error, "Could not create ProofCV session.");
  }
}
