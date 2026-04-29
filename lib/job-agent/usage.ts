import { UsageType } from "@prisma/client";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import type { UsageLimit, UsageRecordInput } from "@/lib/job-agent/types";

const FREE_MONTHLY_PACK_LIMIT = 1;
const FREE_MONTHLY_ANALYSIS_LIMIT = 3;
const PRO_MONTHLY_PACK_LIMIT = 40;
const PRO_MONTHLY_ANALYSIS_LIMIT = 120;

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getLimit(type: UsageType, isPro: boolean) {
  if (type === UsageType.APPLICATION_PACK) {
    return isPro ? PRO_MONTHLY_PACK_LIMIT : FREE_MONTHLY_PACK_LIMIT;
  }

  if (type === UsageType.JOB_ANALYSIS) {
    return isPro ? PRO_MONTHLY_ANALYSIS_LIMIT : FREE_MONTHLY_ANALYSIS_LIMIT;
  }

  return isPro ? 10000 : 500;
}

export async function checkUsageLimit(userId: string, type: UsageType): Promise<UsageLimit> {
  const isPro = await checkSubscription();
  const used = await prismadb.usageRecord.aggregate({
    where: {
      userId,
      type,
      createdAt: {
        gte: monthStart(),
      },
    },
    _sum: {
      amount: true,
    },
  });

  const count = used._sum.amount || 0;
  const limit = getLimit(type, isPro);

  return {
    allowed: count < limit,
    used: count,
    limit,
    isPro,
  };
}

export async function recordUsage(userId: string, input: UsageRecordInput) {
  return prismadb.usageRecord.create({
    data: {
      userId,
      type: input.type,
      amount: input.amount || 1,
      metadata: input.metadata,
    },
  });
}
