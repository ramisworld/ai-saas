import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import MobileSidebar from "./mobile-sidebar";
import { getApiLimitCount } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const Navbar = async () => {
  const apiLimitCount = await getApiLimitCount();
  const isPro = await checkSubscription();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight md:text-base">Application workspace</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Build tailored packs from your Career Vault and the role you want.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analyze"
            className="hidden rounded-full bg-[#164b3f] px-4 py-2 text-sm font-medium text-white shadow-[0_16px_40px_-24px_rgba(22,75,63,0.8)] transition-all duration-300 hover:bg-[#103b32] active:scale-[0.98] sm:inline-flex"
          >
            New pack
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
