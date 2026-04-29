import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Music generation has been removed. Use /api/analyze for application packs." },
    { status: 410 }
  );
}
