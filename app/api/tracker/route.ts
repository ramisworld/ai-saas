import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prismadb.applicationTrackerEntry.findMany({
    where: {
      userId,
    },
    include: {
      applicationPack: true,
      jobPosting: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({ entries });
}
