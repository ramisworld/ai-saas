"use client";

import {
  BackpackIcon,
  CardStackIcon,
  DashboardIcon,
  FileTextIcon,
  GearIcon,
  MagicWandIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FreeCounter } from "@/components/free-counter";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Overview",
    icon: DashboardIcon,
    href: "/dashboard",
  },
  {
    label: "Analyze job",
    icon: MagicWandIcon,
    href: "/analyze",
  },
  {
    label: "Career Vault",
    icon: BackpackIcon,
    href: "/career-vault",
  },
  {
    label: "Application Packs",
    icon: FileTextIcon,
    href: "/packs",
  },
  {
    label: "Job Tracker",
    icon: CardStackIcon,
    href: "/tracker",
  },
  {
    label: "Billing",
    icon: ReaderIcon,
    href: "/billing",
  },
  {
    label: "Settings",
    icon: GearIcon,
    href: "/settings",
  },
];

interface SidebarProps {
  apiLimitCount: number;
  isPro: boolean;
}

const Sidebar = ({ apiLimitCount = 0, isPro = false }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#111512] text-white">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#111512] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <span className="text-sm font-semibold">O</span>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">ProofCV</p>
            <p className="text-xs text-white/50">Job application agent</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {routes.map((route) => {
          const active =
            pathname === route.href ||
            (route.href !== "/dashboard" && pathname?.startsWith(route.href));

          return (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition-all duration-300 hover:bg-white/[0.07] hover:text-white",
                active && "bg-white text-[#111512] shadow-[0_12px_40px_-24px_rgba(255,255,255,0.7)] hover:bg-white hover:text-[#111512]"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4">
        <FreeCounter isPro={isPro} apiLimitCount={apiLimitCount} />
      </div>
    </aside>
  );
};

export default Sidebar;
