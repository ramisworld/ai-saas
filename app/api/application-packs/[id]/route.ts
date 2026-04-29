import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pack = await prismadb.applicationPack.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      jobPosting: true,
      documents: true,
      trackerEntry: true,
    },
  });

  if (!pack) {
    return NextResponse.json({ error: "Application pack not found." }, { status: 404 });
  }

  return NextResponse.json({ pack });
}
