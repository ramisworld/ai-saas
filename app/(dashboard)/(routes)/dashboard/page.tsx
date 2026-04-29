import { auth } from "@clerk/nextjs/server";
import { ArrowRightIcon, BackpackIcon, CardStackIcon, FileTextIcon, MagicWandIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export default async function DashboardPage() {
  const { userId } = await auth();
  const isPro = await checkSubscription();

  const [packs, trackerEntries, vault] = await Promise.all([
    prismadb.applicationPack.findMany({
      where: { userId: userId || "" },
      include: { jobPosting: true, trackerEntry: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prismadb.applicationTrackerEntry.findMany({
      where: { userId: userId || "" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prismadb.careerVault.findUnique({
      where: { userId: userId || "" },
      include: { sources: true, chunks: true },
    }),
  ]);
  const metrics = [
    { label: "Career Vault", value: `${vault?.completeness || 0}% complete`, icon: BackpackIcon },
    { label: "Application packs", value: `${packs.length} recent`, icon: FileTextIcon },
    { label: "Tracker entries", value: `${trackerEntries.length} active`, icon: CardStackIcon },
  ];

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="dark-panel overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-white/60">ProofCV workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
                Build the next application pack from your Career Vault.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Paste a role or job post, add your career context, and ProofCV will generate
                a tailored CV, cover letter, recruiter message, interview prep, and tracker entry.
              </p>
              <Link
                href="/analyze"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111512] transition-all duration-300 hover:-translate-y-0.5"
              >
                Analyze a new job
                <ArrowRightIcon />
              </Link>
            </div>
            <div className="grid gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">{metric.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    </div>
                    <metric.icon className="h-5 w-5 text-white/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="premium-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Recommended next action</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {vault ? "Generate a pack for your next target role." : "Create your Career Vault with your first application pack."}
                </p>
              </div>
              <MagicWandIcon className="h-5 w-5 text-[#164b3f]" />
            </div>
            <Link
              href="/analyze"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#164b3f] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#103b32]"
            >
              Start application pack
            </Link>
            <div className="mt-6 rounded-2xl bg-[#f4efe5] p-4">
              <p className="text-sm font-semibold">{isPro ? "Pro plan active" : "Free plan"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Free includes 3 analyses and 1 application pack per month. Upgrade when you need more packs.
              </p>
            </div>
          </section>

          <section className="premium-panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Recent application packs</h2>
                <p className="mt-1 text-sm text-muted-foreground">Saved outputs and tracker entries.</p>
              </div>
              <Link href="/packs" className="text-sm font-medium text-[#164b3f]">
                View all
              </Link>
            </div>
            <div className="mt-5 divide-y divide-border">
              {packs.length ? (
                packs.map((pack) => (
                  <Link
                    key={pack.id}
                    href={`/packs/${pack.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition hover:text-[#164b3f]"
                  >
                    <div>
                      <p className="font-medium">{pack.jobPosting.roleTitle || pack.jobPosting.targetRole}</p>
                      <p className="text-sm text-muted-foreground">
                        {pack.jobPosting.company || "Company not detected"} · Match {pack.matchScore}%
                      </p>
                    </div>
                    <ArrowRightIcon />
                  </Link>
                ))
              ) : (
                <div className="py-10 text-sm text-muted-foreground">
                  No packs yet. Analyze your first role to create one.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
