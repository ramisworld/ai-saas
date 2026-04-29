import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Generic chat has been replaced by ProofCV application packs. Use /api/analyze." },
    { status: 410 }
  );
}
