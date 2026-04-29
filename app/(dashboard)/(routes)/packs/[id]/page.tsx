import { ApplicationDocumentType } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prismadb from "@/lib/prismadb";

function getDocument(
  documents: Array<{ type: ApplicationDocumentType; content: string }>,
  type: ApplicationDocumentType
) {
  return documents.find((document) => document.type === type)?.content || "";
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function evidenceList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  const pack = await prismadb.applicationPack.findFirst({
    where: {
      id,
      userId: userId || "",
    },
    include: {
      jobPosting: true,
      documents: true,
      trackerEntry: true,
    },
  });

  if (!pack) {
    notFound();
  }

  const tailoredCv = getDocument(pack.documents, ApplicationDocumentType.TAILORED_CV);
  const coverLetter = getDocument(pack.documents, ApplicationDocumentType.COVER_LETTER);
  const recruiterMessage = getDocument(pack.documents, ApplicationDocumentType.RECRUITER_MESSAGE);
  const interviewPrep = getDocument(pack.documents, ApplicationDocumentType.INTERVIEW_PREP);
  const strongMatches = asStringList(pack.strongMatches);
  const weakSpots = asStringList(pack.weakSpots);
  const missingSkills = asStringList(pack.missingSkills);
  const atsKeywords = asStringList(pack.atsKeywords);
  const evidence = evidenceList(pack.evidence);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="dark-panel p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-white/60">{pack.jobPosting.company || "Company not detected"}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
                {pack.jobPosting.roleTitle || pack.jobPosting.targetRole}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">
                Review before sending. ProofCV helps draft and tailor your application but does not guarantee interviews or submit applications for you.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 text-[#111512]">
              <p className="text-sm text-muted-foreground">Match score</p>
              <p className="mt-2 text-5xl font-semibold">{pack.matchScore}%</p>
            </div>
          </div>
        </section>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cv">Tailored CV</TabsTrigger>
            <TabsTrigger value="letter">Cover Letter</TabsTrigger>
            <TabsTrigger value="message">Recruiter Message</TabsTrigger>
            <TabsTrigger value="prep">Interview Prep</TabsTrigger>
            <TabsTrigger value="gaps">Gaps</TabsTrigger>
            <TabsTrigger value="evidence">Evidence Used</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="premium-panel p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold tracking-tight">Match analysis</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{pack.summary}</p>
                <div className="mt-6">
                  <p className="text-sm font-semibold">ATS keywords</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {atsKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full bg-[#e7f3ec] px-3 py-1 text-xs font-medium text-[#164b3f]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="premium-panel p-6">
                <h2 className="text-xl font-semibold tracking-tight">Next step</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {pack.trackerEntry?.nextAction || "Review tailored documents before applying."}
                </p>
                <p className="mt-6 text-sm font-semibold">Tracker status</p>
                <p className="mt-1 text-2xl font-semibold">
                  {pack.trackerEntry?.status.replace("_", " ").toLowerCase() || "draft ready"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cv">
            <EditableMarkdown title="Tailored CV" content={tailoredCv} />
          </TabsContent>
          <TabsContent value="letter">
            <EditableMarkdown title="Cover letter" content={coverLetter} />
          </TabsContent>
          <TabsContent value="message">
            <EditableMarkdown title="Recruiter message" content={recruiterMessage} rows={8} />
          </TabsContent>
          <TabsContent value="prep">
            <MarkdownPanel title="Interview prep" content={interviewPrep} />
          </TabsContent>
          <TabsContent value="gaps">
            <div className="grid gap-6 md:grid-cols-3">
              <ListPanel title="Strong matches" items={strongMatches} />
              <ListPanel title="Weak spots" items={weakSpots} />
              <ListPanel title="Missing skills" items={missingSkills} />
            </div>
          </TabsContent>
          <TabsContent value="evidence">
            <div className="grid gap-4">
              {evidence.length ? (
                evidence.map((item, index) => (
                  <div key={`${item.chunkId}-${index}`} className="premium-panel p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{String(item.title || item.sourceType || "Career evidence")}</p>
                      <p className="text-sm text-muted-foreground">Similarity {Number(item.score || 0).toFixed(3)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(item.text || "")}</p>
                  </div>
                ))
              ) : (
                <div className="premium-panel p-8 text-sm text-muted-foreground">No evidence was stored for this pack.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EditableMarkdown({
  title,
  content,
  rows = 18,
}: {
  title: string;
  content: string;
  rows?: number;
}) {
  return (
    <div className="premium-panel p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit locally, copy, or export from your browser.</p>
      <textarea
        defaultValue={content}
        rows={rows}
        className="mt-5 w-full rounded-2xl border border-input bg-white p-4 font-mono text-sm leading-6 outline-none focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
      />
    </div>
  );
}

function MarkdownPanel({ title, content }: { title: string; content: string }) {
  return (
    <div className="premium-panel p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="prose prose-sm mt-5 max-w-none text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="premium-panel p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <p key={item} className="rounded-2xl bg-[#f4efe5] p-3 text-sm leading-6 text-muted-foreground">
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No items saved.</p>
        )}
      </div>
    </div>
  );
}
