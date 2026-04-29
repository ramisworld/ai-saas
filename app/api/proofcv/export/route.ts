import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const exportSchema = z.object({
  format: z.enum(["docx"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to export your CV." }, { status: 401 });
  }

  const parsed = exportSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Unsupported export format." }, { status: 400 });
  }

  return NextResponse.json(
    {
      status: "stub",
      message: "DOCX export is coming soon. Use PDF/print or copy ATS text for this MVP.",
    },
    { status: 202 }
  );
}
