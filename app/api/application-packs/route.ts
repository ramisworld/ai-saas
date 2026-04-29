import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packs = await prismadb.applicationPack.findMany({
    where: {
      userId,
    },
    include: {
      jobPosting: true,
      trackerEntry: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ packs });
}
