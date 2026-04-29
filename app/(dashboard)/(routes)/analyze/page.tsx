"use client";

import {
  BackpackIcon,
  CheckCircledIcon,
  FileTextIcon,
  Link2Icon,
  MagicWandIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const progressSteps = [
  "Analyzing target role",
  "Reading job post",
  "Understanding your background",
  "Creating Career Vault",
  "Embedding career evidence",
  "Retrieving relevant projects and skills",
  "Calculating match score",
  "Tailoring CV",
  "Writing cover letter",
  "Creating recruiter message",
  "Building interview prep",
  "Saving tracker entry",
];

export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("targetRole") || "";
  const [targetRole, setTargetRole] = useState(initialRole);
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [cvText, setCvText] = useState("");
  const [profileText, setProfileText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);

  const strength = useMemo(() => {
    let score = 15;
    if (targetRole.trim()) score += 20;
    if (jobText.trim() || jobUrl.trim()) score += 20;
    if (cvText.trim() || file) score += 25;
    if (profileText.trim()) score += 20;
    return Math.min(score, 100);
  }, [cvText, file, jobText, jobUrl, profileText, targetRole]);

  useEffect(() => {
    if (!isSubmitting) return;

    const timer = window.setInterval(() => {
      setProgressIndex((index) => Math.min(index + 1, progressSteps.length - 1));
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setProgressIndex(0);

    try {
      const formData = new FormData();
      formData.set("targetRole", targetRole);
      formData.set("jobText", jobText);
      formData.set("jobUrl", jobUrl);
      formData.set("cvText", cvText);
      formData.set("profileText", profileText);

      if (file) {
        formData.set("cvFile", file);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Application pack generation failed.");
      }

      router.push(`/packs/${payload.packId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application pack generation failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="premium-panel p-5 md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#164b3f]">Generate application pack</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
                  Tell ProofCV the role. Add your background. Get the pack.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Start with the target role and add the exact job post when you have it.
                  The stronger your Career Vault, the stronger the application pack.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <TargetIcon /> Target role
                  </span>
                  <input
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                    required
                    placeholder="Applied AI Engineer at Anthropic"
                    className="min-h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm outline-none transition focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Link2Icon /> Job link
                  </span>
                  <input
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    placeholder="https://company.com/jobs/role"
                    className="min-h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm outline-none transition focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <FileTextIcon /> Job post text
                </span>
                <textarea
                  value={jobText}
                  onChange={(event) => setJobText(event.target.value)}
                  rows={7}
                  placeholder="Paste the job description here. If you only know the role/company, leave this blank and ProofCV will continue with lower confidence."
                  className="w-full resize-y rounded-2xl border border-input bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
                />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <BackpackIcon /> Upload CV
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-dashed border-input bg-white p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#164b3f] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">PDF, DOCX, or TXT under 5MB.</p>
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <FileTextIcon /> Paste CV text
                  </span>
                  <textarea
                    value={cvText}
                    onChange={(event) => setCvText(event.target.value)}
                    rows={5}
                    placeholder="Paste your CV text if upload is not convenient."
                    className="w-full resize-y rounded-2xl border border-input bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MagicWandIcon /> Career context
                </span>
                <textarea
                  value={profileText}
                  onChange={(event) => setProfileText(event.target.value)}
                  required={!cvText && !file}
                  rows={8}
                  placeholder="Tell ProofCV about your skills, projects, experience, certifications, goals, achievements, and what you want emphasized or not exaggerated."
                  className="w-full resize-y rounded-2xl border border-input bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#164b3f] focus:ring-4 focus:ring-[#164b3f]/10"
                />
              </label>

              <div className="flex flex-col gap-3 rounded-2xl bg-[#f4efe5] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Application strength: {strength}%</p>
                  <p className="text-xs text-muted-foreground">
                    Add job details, a CV, and project outcomes to improve tailoring.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#164b3f] px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#103b32] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Building pack" : "Generate application pack"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-5">
            <div className="dark-panel p-6">
              <p className="text-sm font-semibold text-white/70">Workflow progress</p>
              <div className="mt-5 space-y-3">
                {progressSteps.map((step, index) => {
                  const complete = isSubmitting && index <= progressIndex;
                  return (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          complete ? "border-[#9ae6b4] bg-[#9ae6b4] text-[#111512]" : "border-white/15 text-white/35"
                        }`}
                      >
                        {complete ? <CheckCircledIcon className="h-4 w-4" /> : index + 1}
                      </div>
                      <span className={complete ? "text-white" : "text-white/45"}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="premium-panel p-6">
              <p className="text-sm font-semibold">MVP scope</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Microphone input and advanced animation are intentionally secondary.
                The main path stores your Career Vault, retrieves evidence with embeddings,
                saves generated outputs, and creates a tracker entry.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
