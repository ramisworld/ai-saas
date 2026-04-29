import { auth } from "@clerk/nextjs/server";
import { BackpackIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import prismadb from "@/lib/prismadb";

function listFromProfile(profile: unknown, key: string) {
  if (!profile || typeof profile !== "object" || !(key in profile)) {
    return [];
  }

  const value = (profile as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

export default async function CareerVaultPage() {
  const { userId } = await auth();
  const vault = await prismadb.careerVault.findUnique({
    where: {
      userId: userId || "",
    },
    include: {
      sources: {
        orderBy: {
          createdAt: "desc",
        },
      },
      chunks: true,
    },
  });

  const profile = vault?.structuredProfile;
  const skills = listFromProfile(profile, "skills") as string[];
  const projects = listFromProfile(profile, "projects");
  const achievements = listFromProfile(profile, "achievements") as string[];
  const goals = listFromProfile(profile, "goals") as string[];

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="premium-panel p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#164b3f]">
                <BackpackIcon /> Career Vault
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your background memory for every application.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                ProofCV stores your CV and profile context as searchable evidence. Every pack retrieves the most relevant chunks for the role.
              </p>
            </div>
            <div className="rounded-3xl bg-[#111512] p-5 text-white md:min-w-64">
              <p className="text-sm text-white/60">Completeness</p>
              <p className="mt-2 text-4xl font-semibold">{vault?.completeness || 0}%</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-[#9ae6b4]"
                  style={{ width: `${vault?.completeness || 0}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {vault ? (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="premium-panel p-6">
              <h2 className="text-xl font-semibold tracking-tight">Detected profile</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm font-medium">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.length ? (
                      skills.slice(0, 24).map((skill) => (
                        <span key={skill} className="rounded-full bg-[#e7f3ec] px-3 py-1 text-xs font-medium text-[#164b3f]">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills detected yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Projects detected</p>
                  <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Achievements detected</p>
                  <p className="mt-1 text-2xl font-semibold">{achievements.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Career goals detected</p>
                  <p className="mt-1 text-2xl font-semibold">{goals.length}</p>
                </div>
              </div>
            </section>

            <section className="premium-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Sources and embedded chunks</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {vault.sources.length} sources · {vault.chunks.length} searchable chunks
                  </p>
                </div>
                <Link href="/analyze" className="rounded-full bg-[#164b3f] px-4 py-2 text-sm font-medium text-white">
                  Add context
                </Link>
              </div>
              <div className="mt-5 divide-y divide-border">
                {vault.sources.map((source) => (
                  <div key={source.id} className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{source.title}</p>
                        <p className="text-sm text-muted-foreground">{source.type}</p>
                      </div>
                      <CheckCircledIcon className="h-5 w-5 text-[#164b3f]" />
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{source.originalText}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="premium-panel p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">No Career Vault yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Generate your first application pack and ProofCV will create your vault from your CV and career context.
            </p>
            <Link
              href="/analyze"
              className="mt-6 inline-flex rounded-full bg-[#164b3f] px-5 py-3 text-sm font-semibold text-white"
            >
              Create Career Vault
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
