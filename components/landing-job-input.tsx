"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const examples = [
  "Applied AI Architect at Anthropic",
  "Graduate Software Engineer at Xero",
  "Junior AI Engineer at a startup",
  "Data Analyst at ANZ",
  "Frontend Developer at Canva",
  "Product Manager internship",
];

export function LandingJobInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    const current = examples[exampleIndex];
    const timer = window.setTimeout(() => {
      if (visibleLength < current.length) {
        setVisibleLength((length) => length + 1);
      } else {
        window.setTimeout(() => {
          setVisibleLength(0);
          setExampleIndex((index) => (index + 1) % examples.length);
        }, 1200);
      }
    }, visibleLength < current.length ? 48 : 1200);

    return () => window.clearTimeout(timer);
  }, [exampleIndex, visibleLength]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetRole = value.trim();
    const query = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : "";
    router.push(`/analyze${query}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border border-white/70 bg-white/90 p-2 shadow-[0_32px_100px_-56px_rgba(22,34,31,0.5)]"
    >
      <div className="grid gap-3 rounded-[1.5rem] border border-[#e7e1d6] bg-[#fffdf8] p-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="sr-only" htmlFor="target-role">
          What job are you trying to land?
        </label>
        <input
          id="target-role"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-14 w-full bg-transparent px-3 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground md:text-lg"
          placeholder={examples[exampleIndex].slice(0, visibleLength)}
        />
        <button
          type="submit"
          className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#164b3f] px-5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#103b32] active:scale-[0.98]"
        >
          Start application pack
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRightIcon />
          </span>
        </button>
      </div>
    </form>
  );
}
