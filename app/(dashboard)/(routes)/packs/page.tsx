import { auth } from "@clerk/nextjs/server";
import { ArrowRightIcon, FileTextIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import prismadb from "@/lib/prismadb";

export default async function PacksPage() {
  const { userId } = await auth();
  const packs = await prismadb.applicationPack.findMany({
    where: {
      userId: userId || "",
    },
    include: {
      jobPosting: true,
      trackerEntry: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="premium-panel p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#164b3f]">
            <FileTextIcon /> Application packs
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Saved packs for every role.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Each pack contains the generated CV, cover letter, recruiter message, interview prep, match analysis, evidence used, and tracker link.
          </p>
        </section>

        <section className="premium-panel p-6">
          <div className="divide-y divide-border">
            {packs.length ? (
              packs.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.id}`}
                  className="grid gap-4 py-5 transition hover:text-[#164b3f] md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-lg font-semibold">{pack.jobPosting.roleTitle || pack.jobPosting.targetRole}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pack.jobPosting.company || "Company not detected"} · Match {pack.matchScore}% ·{" "}
                      {pack.trackerEntry?.status.replace("_", " ").toLowerCase() || "draft ready"}
                    </p>
                  </div>
                  <ArrowRightIcon />
                </Link>
              ))
            ) : (
              <div className="py-16 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">No packs yet</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Analyze a role and add your career context to create your first saved pack.
                </p>
                <Link
                  href="/analyze"
                  className="mt-6 inline-flex rounded-full bg-[#164b3f] px-5 py-3 text-sm font-semibold text-white"
                >
                  Generate first pack
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
