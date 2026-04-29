import { TrackerStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

const allowedStatuses = new Set(Object.values(TrackerStatus));

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const status = body.status as TrackerStatus | undefined;
  const nextAction = typeof body.nextAction === "string" ? body.nextAction : undefined;

  if (status && !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Unsupported tracker status." }, { status: 400 });
  }

  const entry = await prismadb.applicationTrackerEntry.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      status,
      nextAction,
    },
  });

  if (!entry.count) {
    return NextResponse.json({ error: "Tracker entry not found." }, { status: 404 });
  }

  const updated = await prismadb.applicationTrackerEntry.findUnique({
    where: {
      id,
    },
  });

  return NextResponse.json({ entry: updated });
}
