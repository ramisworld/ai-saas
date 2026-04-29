import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const LandingNavbar = async () => {
  const { userId } = await auth();

  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111512] text-sm font-semibold text-white">
          O
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight">Osmomind</p>
          <p className="text-xs text-muted-foreground">AI job application agent</p>
        </div>
      </Link>
      <Link
        href={userId ? "/dashboard" : "/sign-up"}
        className="rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#b9ad9a]"
      >
        {userId ? "Open workspace" : "Sign up"}
      </Link>
    </nav>
  );
};
