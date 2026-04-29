import { auth } from "@clerk/nextjs/server";
import { CardStackIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import { TrackerStatusSelect } from "@/components/tracker-status-select";
import prismadb from "@/lib/prismadb";

export default async function TrackerPage() {
  const { userId } = await auth();
  const entries = await prismadb.applicationTrackerEntry.findMany({
    where: {
      userId: userId || "",
    },
    include: {
      applicationPack: true,
      jobPosting: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="premium-panel p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#164b3f]">
            <CardStackIcon /> Job Tracker
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Track every draft and application.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Generated packs are saved here as draft-ready entries. Update status as you apply and interview.
          </p>
        </section>

        <section className="premium-panel overflow-hidden">
          {entries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-[#f4efe5] text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Company</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Next action</th>
                    <th className="px-5 py-4 font-semibold">Pack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-4">{entry.company || "Company not detected"}</td>
                      <td className="px-5 py-4 font-medium">{entry.role}</td>
                      <td className="px-5 py-4">
                        <TrackerStatusSelect entryId={entry.id} status={entry.status} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{entry.nextAction || "Review pack"}</td>
                      <td className="px-5 py-4">
                        {entry.applicationPackId ? (
                          <Link className="font-medium text-[#164b3f]" href={`/packs/${entry.applicationPackId}`}>
                            Open pack
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">No pack</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">No tracker entries yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Generate an application pack and ProofCV will save the tracker entry as Draft ready.
              </p>
              <Link
                href="/analyze"
                className="mt-6 inline-flex rounded-full bg-[#164b3f] px-5 py-3 text-sm font-semibold text-white"
              >
                Create tracker entry
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
