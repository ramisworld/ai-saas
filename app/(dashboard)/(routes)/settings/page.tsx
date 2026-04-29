import { GearIcon } from "@radix-ui/react-icons";

import { SubscriptionButton } from "@/components/subscription-button";
import { aiConfig } from "@/lib/job-agent/ai";
import { checkSubscription } from "@/lib/subscription";

export default async function SettingsPage() {
  const isPro = await checkSubscription();

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="premium-panel p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#164b3f]">
            <GearIcon /> Settings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Account and system status.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage billing and confirm the server-side AI model configuration used by application workflows.
          </p>
        </section>

        <section className="premium-panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Subscription</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPro ? "You are currently on a paid plan." : "You are currently on the free plan."}
          </p>
          <div className="mt-5">
            <SubscriptionButton isPro={isPro} />
          </div>
        </section>

        <section className="premium-panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Model configuration</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["Text model", aiConfig.textModel],
              ["Fast model", aiConfig.fastModel],
              ["Embedding model", aiConfig.embeddingModel],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#f4efe5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                <p className="mt-2 break-words font-mono text-sm">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            OpenAI calls happen only on the server. If a configured model is unavailable, ProofCV returns a clear generation error.
          </p>
        </section>
      </div>
    </div>
  );
}
