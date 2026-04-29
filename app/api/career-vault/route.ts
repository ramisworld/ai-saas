import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vault = await prismadb.careerVault.findUnique({
    where: {
      userId,
    },
    include: {
      sources: {
        orderBy: {
          createdAt: "desc",
        },
      },
      chunks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
      },
    },
  });

  return NextResponse.json({ vault });
}
