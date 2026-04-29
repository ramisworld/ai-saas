import { CheckIcon, ReaderIcon } from "@radix-ui/react-icons";

import { SubscriptionButton } from "@/components/subscription-button";
import { checkSubscription } from "@/lib/subscription";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For trying the workflow.",
    features: ["3 job analyses/month", "1 application pack/month", "Career Vault MVP", "Tracker entries"],
  },
  {
    name: "Pro",
    price: "$19",
    description: "For active job seekers.",
    features: ["40 application packs/month", "Full Career Vault", "Interview prep", "Application tracker"],
    featured: true,
  },
];

export default async function BillingPage() {
  const isPro = await checkSubscription();

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="premium-panel p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#164b3f]">
            <ReaderIcon /> Billing
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Subscription built around your search.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upgrade when you need more tailored packs. ProofCV does not submit applications or guarantee interviews.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={plan.featured ? "dark-panel p-6" : "premium-panel p-6"}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{plan.name}</h2>
                  <p className={plan.featured ? "mt-2 text-sm text-white/60" : "mt-2 text-sm text-muted-foreground"}>
                    {plan.description}
                  </p>
                </div>
                {plan.featured && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-8 text-5xl font-semibold">
                {plan.price}
                <span className={plan.featured ? "text-base text-white/60" : "text-base text-muted-foreground"}>/month</span>
              </p>
              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className={plan.featured ? "flex gap-3 text-sm text-white/70" : "flex gap-3 text-sm text-muted-foreground"}>
                    <CheckIcon className="mt-0.5 h-4 w-4 text-[#164b3f]" />
                    {feature}
                  </div>
                ))}
              </div>
              {plan.name === "Pro" && (
                <div className="mt-8">
                  <SubscriptionButton isPro={isPro} />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
