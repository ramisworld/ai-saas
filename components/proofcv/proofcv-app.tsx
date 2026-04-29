"use client";

import {
  ArrowRightIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  CrossCircledIcon,
  FileTextIcon,
  LockClosedIcon,
  MagicWandIcon,
  PaperPlaneIcon,
  PlusIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { browserPendingSessionStore } from "@/lib/proofcv/pending-session-store";
import {
  MAX_BRAIN_DUMP_CHARS,
  MAX_CV_UPLOAD_BYTES,
  MAX_JOB_DESCRIPTION_CHARS,
  type CreatePlanResponse,
  type CvMode,
  type FollowUpQuestion,
  type GenerateCvResponse,
  type JobFitPlan,
  type ParsedJobContext,
  type PrepareFollowupsResponse,
  type ProofCvEvidenceItem,
  type RetrievalResult,
  type TailoredCv,
  type VerificationReport,
  type WorkflowState,
} from "@/lib/proofcv/schemas";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  compact?: boolean;
};

const examples = [
  "AI Engineer at Anthropic",
  "Graduate Software Engineer",
  "Data Analyst internship",
  "Product Manager role",
];

const jobContextOptions = [
  { value: "paste", label: "Paste job description", Icon: FileTextIcon },
  { value: "screenshot", label: "Upload screenshot", Icon: UploadIcon },
  { value: "role_only", label: "I only know the role", Icon: MagicWandIcon },
] as const;

const assistantTransition = {
  type: "spring",
  stiffness: 150,
  damping: 22,
} as const;

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function authRedirect(path: "/sign-up" | "/sign-in") {
  return `${path}?redirect_url=%2F`;
}

function ProgressiveText({ text }: { text: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const step = Math.max(2, Math.ceil(text.length / 90));
    const timer = window.setInterval(() => {
      setVisible((current) => {
        const next = Math.min(text.length, current + step);

        if (next >= text.length) {
          window.clearInterval(timer);
        }

        return next;
      });
    }, 14);

    return () => window.clearInterval(timer);
  }, [text]);

  return <>{text.slice(0, visible)}</>;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-[#203237]/35"
          animate={{ y: [0, -4, 0], opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }}
        />
      ))}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={assistantTransition}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[86%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-[0_18px_50px_-34px_rgba(18,36,42,0.45)]",
          isUser && "bg-[#18292f] text-white",
          !isUser && !isSystem && "border border-white/80 bg-white/90 text-[#203237]",
          isSystem && "border border-[#ffd9a8]/70 bg-[#fff7eb] text-[#6d4b1f]"
        )}
      >
        {message.role === "assistant" ? <ProgressiveText text={message.content} /> : message.content}
      </div>
    </motion.div>
  );
}

function ProofLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a2f] shadow-[inset_0_-8px_16px_rgba(128,46,12,0.18)]">
        <span className="h-3.5 w-5 rounded-full border-y-2 border-white/90" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-[#071114]">ProofCV</span>
    </div>
  );
}

function TopNav() {
  return (
    <nav className="mx-auto flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between rounded-full border border-white/80 bg-white/[0.92] px-3 py-2 shadow-[0_20px_70px_-48px_rgba(20,42,48,0.55)] backdrop-blur md:px-4">
      <Link href="/" className="rounded-full px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18292f]">
        <ProofLogo />
      </Link>
      <div className="hidden items-center gap-7 text-sm font-medium text-[#26383d]/[0.75] md:flex">
        {["Product", "Examples", "Pricing", "How it works"].map((item) => (
          <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="transition hover:text-[#071114]">
            {item}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={authRedirect("/sign-in")}
          className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#18292f] transition hover:bg-[#edf8f9] sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href={authRedirect("/sign-up")}
          className="rounded-full border border-[#b5ec4a] bg-[#e8ff77] px-4 py-2 text-sm font-semibold text-[#071114] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Start free
        </Link>
      </div>
    </nav>
  );
}

function ModeToggle({ cvMode, setCvMode }: { cvMode: CvMode; setCvMode: (mode: CvMode) => void }) {
  const existing = cvMode === "existing_cv";

  return (
    <button
      type="button"
      onClick={() => setCvMode(existing ? "scratch" : "existing_cv")}
      className="inline-flex items-center gap-2 rounded-full bg-[#f2f3f0] px-2 py-1 text-xs font-medium text-[#26383d] transition hover:bg-[#e9eeea] active:scale-[0.98]"
    >
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", existing ? "bg-[#18292f]" : "bg-white")}>
        <span className={cn("block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", existing && "translate-x-4")} />
      </span>
      {existing ? "Tailor existing CV" : "Start from scratch"}
    </button>
  );
}

function InitialInput({
  value,
  setValue,
  cvMode,
  setCvMode,
  cvFile,
  setCvFile,
  onSubmit,
  disabled,
}: {
  value: string;
  setValue: (value: string) => void;
  cvMode: CvMode;
  setCvMode: (mode: CvMode) => void;
  cvFile: File | null;
  setCvFile: (file: File | null) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div layout className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/[0.85] bg-white/95 p-2 shadow-[0_34px_120px_-70px_rgba(19,57,68,0.7)]">
      <div className="rounded-[1.55rem] border border-[#dfe8e7] bg-[#fffefe] p-4">
        <div className="flex min-h-20 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#23363b] transition hover:bg-[#edf8f9] active:scale-[0.96]"
            aria-label="Attach CV"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            rows={3}
            placeholder="Describe the role... e.g. AI Architect at Anthropic"
            className="min-h-20 flex-1 resize-none bg-transparent pt-1 text-lg font-medium leading-7 text-[#071114] outline-none placeholder:text-[#7c8b90]"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={onSubmit}
            className="mt-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#687078] text-white shadow-[0_14px_36px_-18px_rgba(0,0,0,0.65)] transition hover:bg-[#18292f] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Send role"
          >
            <PaperPlaneIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ModeToggle cvMode={cvMode} setCvMode={setCvMode} />
            {cvMode === "existing_cv" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#b8c7c8] px-3 py-1.5 text-xs font-medium text-[#2b4248] transition hover:border-[#18292f]"
              >
                <FileTextIcon className="h-3.5 w-3.5" />
                {cvFile ? cvFile.name : "Attach CV"}
              </button>
            )}
          </div>
          <p className="text-xs text-[#6e7d82]">PDF/DOCX under 5MB. Your Career Vault stays evidence-first.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => setCvFile(event.target.files?.[0] || null)}
        />
      </div>
    </motion.div>
  );
}

function AttachmentSummary({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe8e7] bg-white/[0.88] p-4 text-left shadow-[0_20px_60px_-46px_rgba(20,42,48,0.5)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf8f9] text-[#1d3c44]">
          <FileTextIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#18292f]">{label}</p>
          <p className="text-xs text-[#6e7d82]">{wordCount(text).toLocaleString()} words</p>
        </div>
      </div>
    </div>
  );
}

function JobContextStep({
  mode,
  setMode,
  jobDescription,
  setJobDescription,
  screenshotFile,
  setScreenshotFile,
  onContinue,
}: {
  mode: "paste" | "screenshot" | "role_only" | null;
  setMode: (mode: "paste" | "screenshot" | "role_only") => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  screenshotFile: File | null;
  setScreenshotFile: (file: File | null) => void;
  onContinue: () => void;
}) {
  return (
    <motion.div layout className="space-y-4 rounded-[1.8rem] border border-white/75 bg-white/[0.82] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
      <div>
        <p className="text-sm font-semibold text-[#18292f]">Add the job post so I can tailor this properly.</p>
        <p className="mt-1 text-sm text-[#6e7d82]">Paste the description, upload a screenshot, or continue with only the role.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {jobContextOptions.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "group flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition hover:-translate-y-0.5 active:scale-[0.99]",
              mode === value ? "border-[#18292f] bg-[#edf8f9] text-[#18292f]" : "border-[#dfe8e7] bg-white text-[#31474d]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
      {mode === "paste" && (
        <div>
          {wordCount(jobDescription) > 80 ? (
            <AttachmentSummary label="Job description attached" text={jobDescription} />
          ) : null}
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value.slice(0, MAX_JOB_DESCRIPTION_CHARS))}
            rows={6}
            placeholder="Paste the job description here..."
            className="mt-3 w-full resize-y rounded-2xl border border-[#dfe8e7] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#18292f] focus:ring-4 focus:ring-[#b8eef6]/35"
          />
          <p className="mt-2 text-xs text-[#6e7d82]">{jobDescription.length.toLocaleString()} / {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters</p>
        </div>
      )}
      {mode === "screenshot" && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8c7c8] bg-white p-6 text-center transition hover:border-[#18292f]">
          <UploadIcon className="h-6 w-6 text-[#18292f]" />
          <span className="mt-2 text-sm font-semibold text-[#18292f]">{screenshotFile ? screenshotFile.name : "Upload job listing screenshot"}</span>
          <span className="mt-1 text-xs text-[#6e7d82]">PNG, JPG, or WebP under 5MB.</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setScreenshotFile(event.target.files?.[0] || null)} />
        </label>
      )}
      {mode === "role_only" && (
        <div className="rounded-2xl border border-[#ffd9a8]/80 bg-[#fff7eb] p-4 text-sm leading-6 text-[#74521f]">
          Role-only mode works, but the CV will be less specific without the exact job description.
        </div>
      )}
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex items-center gap-2 rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98]"
      >
        Continue
        <ChevronRightIcon />
      </button>
    </motion.div>
  );
}

function ContextStep({
  cvMode,
  cvFile,
  setCvFile,
  brainDump,
  setBrainDump,
  onSwitchToScratch,
  onProcess,
  isBusy,
}: {
  cvMode: CvMode;
  cvFile: File | null;
  setCvFile: (file: File | null) => void;
  brainDump: string;
  setBrainDump: (value: string) => void;
  onSwitchToScratch: () => void;
  onProcess: () => void;
  isBusy: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (cvMode === "existing_cv") {
    return (
      <motion.div layout className="space-y-4 rounded-[1.8rem] border border-white/75 bg-white/[0.82] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
        <div>
          <p className="text-sm font-semibold text-[#18292f]">I’ll read your CV, compare it to this role, then ask only what’s missing.</p>
          <p className="mt-1 text-sm text-[#6e7d82]">Review your CV before applying. ProofCV helps tailor your application but does not guarantee interviews or offers.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8c7c8] bg-white p-8 text-center transition hover:border-[#18292f]"
        >
          <FileTextIcon className="h-7 w-7 text-[#18292f]" />
          <span className="mt-3 text-sm font-semibold text-[#18292f]">{cvFile ? cvFile.name : "Attach CV"}</span>
          <span className="mt-1 text-xs text-[#6e7d82]">PDF or DOCX under 5MB. We extract evidence, not a generic summary.</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => setCvFile(event.target.files?.[0] || null)}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={onProcess}
            className="rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Processing..." : "Continue with CV"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onSwitchToScratch}
            className="rounded-full border border-[#d5e1df] bg-white px-5 py-3 text-sm font-semibold text-[#18292f] transition hover:bg-[#edf8f9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Switch to start from scratch
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout className="space-y-4 rounded-[1.8rem] border border-white/75 bg-white/[0.82] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
      <div>
        <p className="text-sm font-semibold text-[#18292f]">Give me a compact brain dump. Messy is fine, I’ll structure it.</p>
        <p className="mt-1 text-sm leading-6 text-[#6e7d82]">
          Include education, skills, projects, work experience, certifications, tools, achievements, career goals, and anything impressive that is not obvious from a normal CV.
        </p>
      </div>
      <textarea
        value={brainDump}
        onChange={(event) => setBrainDump(event.target.value.slice(0, MAX_BRAIN_DUMP_CHARS))}
        rows={8}
        placeholder="Paste rough notes about your background..."
        className="w-full resize-y rounded-2xl border border-[#dfe8e7] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#18292f] focus:ring-4 focus:ring-[#b8eef6]/35"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#6e7d82]">{brainDump.length.toLocaleString()} / {MAX_BRAIN_DUMP_CHARS.toLocaleString()} characters</p>
        <button
          type="button"
          disabled={isBusy}
          onClick={onProcess}
          className="rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? "Processing..." : "Process Career Vault"}
        </button>
      </div>
    </motion.div>
  );
}

function FollowUpStep({
  questions,
  answers,
  setAnswers,
  onSubmit,
}: {
  questions: FollowUpQuestion[];
  answers: Record<string, string>;
  setAnswers: (answers: Record<string, string>) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div layout className="space-y-4 rounded-[1.8rem] border border-white/75 bg-white/[0.82] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
      <div>
        <p className="text-sm font-semibold text-[#18292f]">A few targeted questions will improve the CV.</p>
        <p className="mt-1 text-sm text-[#6e7d82]">Short answers are fine. Skip anything you do not know.</p>
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <label key={question.id} className="block rounded-2xl border border-[#dfe8e7] bg-white p-4">
            <span className="text-sm font-semibold text-[#18292f]">{question.question}</span>
            <span className="mt-1 block text-xs text-[#6e7d82]">{question.rationale}</span>
            <textarea
              value={answers[question.id] || ""}
              onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
              rows={3}
              className="mt-3 w-full resize-y rounded-xl border border-[#e5eeed] bg-[#fbfefd] p-3 text-sm outline-none focus:border-[#18292f] focus:ring-4 focus:ring-[#b8eef6]/35"
              placeholder="Answer in one or two lines..."
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={onSubmit} className="rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98]">
        Create Job Fit Plan
      </button>
    </motion.div>
  );
}

function JobFitPlanCard({ plan, retrieval, onGenerate }: { plan: JobFitPlan; retrieval: RetrievalResult | null; onGenerate: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={assistantTransition} className="rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
      <p className="text-sm font-semibold text-[#18292f]">Here’s the strategy I’ll use before writing your CV.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <PlanBlock title="Target" items={[plan.target]} />
        <PlanBlock title="What this role likely cares about" items={plan.caresAbout} />
        <PlanBlock title="Your strongest evidence" items={plan.strongestEvidence} />
        <PlanBlock title="Gaps / be careful" items={plan.gapsAndRisks} />
      </div>
      <div className="mt-4 rounded-2xl bg-[#edf8f9] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#527077]">CV strategy</p>
        <p className="mt-2 text-sm leading-6 text-[#203237]"><ProgressiveText text={plan.strategy} /></p>
      </div>
      {retrieval && <p className="mt-3 text-xs text-[#6e7d82]">{retrieval.label}</p>}
      <button type="button" onClick={onGenerate} className="mt-5 rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98]">
        Build tailored CV
      </button>
    </motion.div>
  );
}

function PlanBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#dfe8e7] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#527077]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm leading-6 text-[#203237]">{item}</p>
        ))}
      </div>
    </div>
  );
}

function CvPreview({ cv }: { cv: TailoredCv }) {
  return (
    <div id="proofcv-print-area" className="proofcv-page mx-auto bg-white p-8 text-[#111512] shadow-[0_30px_100px_-70px_rgba(13,31,36,0.6)]">
      <header className="border-b border-[#d8dfdd] pb-4">
        <h2 className="text-3xl font-semibold tracking-tight">{cv.header.name}</h2>
        <p className="mt-2 text-sm text-[#536468]">
          {cv.header.email} | {cv.header.phone} | {cv.header.links}
        </p>
      </header>
      <div className="mt-5 space-y-4">
        {cv.sections.map((section, index) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, ...assistantTransition }}
          >
            <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#18292f]">{section.title}</h3>
            <div className="mt-2 space-y-1.5 text-sm leading-5">
              {section.content.map((item) => (
                <p key={item}>{section.id === "summary" ? item : `• ${item}`}</p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function VerificationPanel({ verification }: { verification: VerificationReport }) {
  return (
    <div className="rounded-[1.5rem] border border-[#dfe8e7] bg-white p-4">
      <p className="text-sm font-semibold text-[#18292f]">Evidence Check</p>
      <div className="mt-4 space-y-3 text-sm">
        <EvidenceList icon={<CheckCircledIcon />} title="Supported" items={verification.supported} tone="green" />
        <EvidenceList icon={<LockClosedIcon />} title="Needs confirmation" items={verification.needsConfirmation} tone="amber" />
        <div>
          <p className="mb-2 flex items-center gap-2 font-semibold text-[#7b3e2f]"><CrossCircledIcon /> Removed / rewritten</p>
          {verification.rewritten.length ? (
            <div className="space-y-2">
              {verification.rewritten.map((item) => (
                <div key={`${item.original}-${item.rewrite}`} className="rounded-xl bg-[#fff3ed] p-3 text-[#744231]">
                  <p className="line-through opacity-70">{item.original}</p>
                  <p className="mt-1">{item.rewrite}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6e7d82]">No unsupported claims found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceList({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: "green" | "amber" }) {
  return (
    <div>
      <p className={cn("mb-2 flex items-center gap-2 font-semibold", tone === "green" ? "text-[#1c6b47]" : "text-[#806019]")}>{icon}{title}</p>
      {items.length ? (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <p key={item} className={cn("rounded-xl p-3", tone === "green" ? "bg-[#eef8f1] text-[#1f5139]" : "bg-[#fff7df] text-[#73581d]")}>{item}</p>
          ))}
        </div>
      ) : (
        <p className="text-[#6e7d82]">None yet.</p>
      )}
    </div>
  );
}

export function ProofCvApp() {
  const { isLoaded, isSignedIn } = useUser();
  const [workflowState, setWorkflowState] = useState<WorkflowState>("landing");
  const [targetRoleRaw, setTargetRoleRaw] = useState("");
  const [cvMode, setCvMode] = useState<CvMode>("scratch");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [jobContextMode, setJobContextMode] = useState<"paste" | "screenshot" | "role_only" | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [brainDump, setBrainDump] = useState("");
  const [parsedJob, setParsedJob] = useState<ParsedJobContext | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<Array<ProofCvEvidenceItem & { id: string }>>([]);
  const [retrieval, setRetrieval] = useState<RetrievalResult | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<JobFitPlan | null>(null);
  const [cvResult, setCvResult] = useState<GenerateCvResponse | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);

  const showEditor = !!cvResult?.cv && (workflowState === "cv_editor" || workflowState === "export_ready");

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setMessages((current) => [...current, { id: createId(role), role, content }]);
  };

  const addUniqueMessage = (id: string, role: ChatMessage["role"], content: string) => {
    setMessages((current) => (current.some((message) => message.id === id) ? current : [...current, { id, role, content }]));
  };

  useEffect(() => {
    if (!isLoaded || restored) return;

    const pending = browserPendingSessionStore.read();

    const timer = window.setTimeout(() => {
      if (pending) {
        setPendingSessionId(pending.id);
        setTargetRoleRaw(pending.targetRoleRaw);
        setCvMode(pending.cvMode);

        if (isSignedIn) {
          setWorkflowState("job_context");
          setMessages([
            {
              id: "restored-user",
              role: "user",
              content: pending.targetRoleRaw,
            },
            {
              id: "restored-assistant",
              role: "assistant",
              content: pending.cvFileMeta
                ? "Welcome back. I restored your role and CV mode. Reattach your CV when we reach that step so I can read it securely."
                : "Welcome back. I restored your role and I’m ready for the job post.",
            },
          ]);
        }
      }

      setRestored(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn, restored]);

  useEffect(() => {
    if (workflowState === "landing") return;
    window.setTimeout(() => flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [workflowState, messages.length]);

  async function ensureServerSession() {
    if (sessionId) return sessionId;

    const response = await fetch("/api/proofcv/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anonymousSessionId: pendingSessionId,
        targetRoleRaw,
        cvMode,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Could not create ProofCV session.");
    }

    setSessionId(payload.sessionId);
    return payload.sessionId as string;
  }

  function submitInitialRole() {
    const role = targetRoleRaw.trim();

    if (!role) {
      toast.error("Describe the role you want first.");
      return;
    }

    if (cvFile && cvFile.size > MAX_CV_UPLOAD_BYTES) {
      toast.error("Your CV file is too large. Upload a PDF or DOCX under 5MB.");
      return;
    }

    const pending = browserPendingSessionStore.save({
      targetRoleRaw: role,
      cvMode,
      cvFileMeta: cvFile ? { name: cvFile.name, type: cvFile.type, size: cvFile.size } : null,
    });

    setPendingSessionId(pending.id);
    setMessages([
      { id: createId("user"), role: "user", content: role },
      {
        id: createId("assistant"),
        role: "assistant",
        content: `Great, I’ll tailor this around ${role}. To make it accurate, add the job post if you have it.`,
      },
    ]);

    if (!isSignedIn) {
      setWorkflowState("auth_gate");
      return;
    }

    setWorkflowState("job_context");
  }

  function continueFromJobContext() {
    if (!jobContextMode) {
      toast.error("Choose how you want to add job context.");
      return;
    }

    let nextMode = jobContextMode;

    if (nextMode === "screenshot" && !screenshotFile) {
      toast.error("Upload a screenshot or choose role-only mode.");
      return;
    }

    if (nextMode === "paste" && !jobDescription.trim()) {
      nextMode = "role_only";
      setJobContextMode("role_only");
      addMessage("system", "No job description added. I can continue with only the role, but the CV will be less specific.");
    }

    if (nextMode === "role_only") {
      addMessage("system", "Role-only warning: without the exact job description, the CV will be less specific.");
    }

    setWorkflowState("cv_or_profile_context");
    addMessage(
      "assistant",
      cvMode === "existing_cv"
        ? "I’ll read your CV, compare it to this role, then ask only what’s missing."
        : "Since we’re starting from scratch, give me a compact brain dump. Messy is fine, I’ll structure it."
    );
  }

  async function processContext() {
    if (isBusy) return;

    if (cvMode === "existing_cv" && !cvFile) {
      addMessage("assistant", "Attach your CV as a PDF/DOCX, or switch to Start from scratch and give me a compact brain dump.");
      return;
    }

    if (cvMode === "scratch" && !brainDump.trim()) {
      toast.error("Add a compact brain dump so I have real evidence to work with.");
      return;
    }

    setIsBusy(true);
    setWorkflowState("processing_context");
    addUniqueMessage(
      "processing-career-vault",
      "assistant",
      "I’m turning your context into EvidenceItems and retrieving the strongest matches from your Career Vault."
    );

    try {
      const serverSessionId = await ensureServerSession();
      const formData = new FormData();
      formData.set("action", "prepare_followups");
      formData.set("sessionId", serverSessionId);
      formData.set("anonymousSessionId", pendingSessionId || "");
      formData.set("targetRoleRaw", targetRoleRaw);
      formData.set("cvMode", cvMode);
      formData.set("jobContextMode", jobContextMode || "role_only");
      formData.set("jobDescription", jobDescription);
      formData.set("brainDump", brainDump);

      if (cvFile) {
        formData.set("cvFile", cvFile);
      }

      if (screenshotFile) {
        formData.set("screenshotFile", screenshotFile);
      }

      const response = await fetch("/api/proofcv/step", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as PrepareFollowupsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "ProofCV could not process your context.");
      }

      setSessionId(payload.sessionId);
      setParsedJob(payload.parsedJob);
      setEvidenceItems(payload.evidenceItems);
      setRetrieval(payload.retrieval);
      setFollowUpQuestions(payload.followUpQuestions);
      setWorkflowState("ai_followup_questions");
      addMessage("assistant", `I found ${payload.evidenceItems.length} EvidenceItems. I’ll ask ${payload.followUpQuestions.length} focused questions before writing.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ProofCV could not process your context.");
      setWorkflowState("cv_or_profile_context");
    } finally {
      setIsBusy(false);
    }
  }

  async function createPlan() {
    if (isBusy) return;
    if (!sessionId) return;

    setIsBusy(true);
    addMessage("assistant", "Here’s the strategy I’ll use before writing your CV.");

    try {
      const response = await fetch("/api/proofcv/step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_plan",
          sessionId,
          targetRoleRaw,
          followupAnswers: followUpQuestions.map((question) => ({
            question: question.question,
            answer: followUpAnswers[question.id] || "",
          })),
        }),
      });
      const payload = (await response.json()) as CreatePlanResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not create the Job Fit Plan.");
      }

      setPlan(payload.plan);
      setRetrieval(payload.retrieval);
      setWorkflowState("job_fit_plan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the Job Fit Plan.");
    } finally {
      setIsBusy(false);
    }
  }

  async function generateCv() {
    if (isBusy) return;
    if (!sessionId || !plan) return;

    setWorkflowState("generating_cv");
    setIsBusy(true);
    addMessage("assistant", "Great, I have enough signal. I’ll build a tailored one-page CV now.");

    try {
      const response = await fetch("/api/proofcv/step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_cv",
          sessionId,
          targetRoleRaw,
          plan,
        }),
      });
      const payload = (await response.json()) as GenerateCvResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate the CV.");
      }

      setCvResult(payload);
      setWorkflowState("cv_editor");
      browserPendingSessionStore.clear();
      addMessage("assistant", "Your tailored CV is ready. You can edit details, ask for changes, or export.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the CV.");
      setWorkflowState("job_fit_plan");
    } finally {
      setIsBusy(false);
    }
  }

  async function editCv() {
    if (isBusy) return;
    if (!sessionId || !cvResult || !editInstruction.trim()) return;

    setIsBusy(true);

    try {
      const response = await fetch("/api/proofcv/step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "edit_cv",
          sessionId,
          artifactId: cvResult.artifactId,
          instruction: editInstruction,
          currentCv: cvResult.cv,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not edit the CV.");
      }

      setCvResult({
        ...cvResult,
        cv: payload.cv,
        verification: payload.verification,
      });
      addMessage("user", editInstruction);
      addMessage("assistant", `Edit applied using the ${payload.modelTier === "best" ? "BEST_MODEL" : "FAST_MODEL"} path.`);
      setEditInstruction("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not edit the CV.");
    } finally {
      setIsBusy(false);
    }
  }

  async function exportDocx() {
    const response = await fetch("/api/proofcv/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "docx" }),
    });
    const payload = await response.json();
    toast(payload.message || "DOCX export is coming soon.");
  }

  const helperText = useMemo(() => {
    if (workflowState === "landing") {
      return "Start with the dream role. Add the job post and your CV when ready.";
    }

    if (parsedJob?.specificity === "role_only") {
      return "Role-only mode is active, so the CV will be less specific than it would be with the job post.";
    }

    return "Review your CV before applying. ProofCV helps tailor your application but does not guarantee interviews or offers.";
  }, [parsedJob?.specificity, workflowState]);

  return (
    <main className="proofcv-root min-h-dvh overflow-hidden bg-[#f9fbf7] text-[#071114]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(83,190,215,0.72),transparent_42%),linear-gradient(180deg,#86cfdd_0%,#eaf6f5_42%,#fffdf8_70%,#ffd6a5_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035] [background-image:radial-gradient(#071114_0.8px,transparent_0.8px)] [background-size:18px_18px]" />

      <header className="fixed left-0 right-0 top-5 z-30">
        <TopNav />
      </header>

      <section className={cn("mx-auto max-w-7xl px-5 pb-20 pt-28 transition-all", showEditor ? "lg:pt-28" : "min-h-dvh")}>
        {!showEditor && (
          <motion.div layout className={cn("mx-auto text-center", workflowState === "landing" || workflowState === "auth_gate" ? "max-w-5xl pt-24 md:pt-36" : "max-w-4xl pt-10")}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={assistantTransition}
              className="mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/[0.45] px-4 py-2 text-sm font-medium text-[#18292f] shadow-[0_22px_70px_-54px_rgba(20,42,48,0.6)]"
            >
              <span className="rounded-full bg-[#ffb278] px-3 py-1 text-xs font-semibold text-[#5d2d0d]">Built for targeted applications, not generic CVs</span>
              <ArrowRightIcon />
            </motion.div>
            <motion.h1 layout className={cn("mx-auto max-w-5xl text-balance font-semibold leading-[0.98] tracking-tight text-[#071114]", workflowState === "landing" || workflowState === "auth_gate" ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl")}>
              Build the CV for the job you actually want.
            </motion.h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#31474d] md:text-lg">
              Tell us the role. Add your CV or start from scratch. We’ll tailor a one-page CV using your real experience.
            </p>
            <div className="mt-10">
              <InitialInput
                value={targetRoleRaw}
                setValue={setTargetRoleRaw}
                cvMode={cvMode}
                setCvMode={setCvMode}
                cvFile={cvFile}
                setCvFile={setCvFile}
                onSubmit={submitInitialRole}
                disabled={!isLoaded || isBusy}
              />
            </div>
            <p className="mt-5 text-xs font-medium text-[#6e7d82]">{helperText}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setTargetRoleRaw(example)}
                  className="rounded-full border border-[#cbd8d7] bg-white/[0.55] px-4 py-2 text-sm font-medium text-[#26383d] transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={flowRef} className={cn("mx-auto mt-10", showEditor ? "max-w-7xl" : "max-w-3xl")}>
          {!showEditor ? (
            <div className="space-y-5">
              <AnimatePresence>
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </AnimatePresence>

              {workflowState === "auth_gate" && (
                <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={assistantTransition} className="rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 text-left shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf8f9] text-[#18292f]">
                      <LockClosedIcon />
                    </div>
                    <div>
                      <p className="font-semibold text-[#18292f]">Create your free account so we can save your Career Vault and tailor future applications.</p>
                      <p className="mt-2 text-sm leading-6 text-[#6e7d82]">Your first role is saved locally. After Clerk auth, ProofCV will restore this workflow on the same page.</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={authRedirect("/sign-up")} className="rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98]">
                          Continue to Clerk
                        </Link>
                        <Link href={authRedirect("/sign-in")} className="rounded-full border border-[#d5e1df] bg-white px-5 py-3 text-sm font-semibold text-[#18292f] transition hover:bg-[#edf8f9]">
                          Sign in
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {workflowState === "job_context" && (
                <JobContextStep
                  mode={jobContextMode}
                  setMode={setJobContextMode}
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                  screenshotFile={screenshotFile}
                  setScreenshotFile={setScreenshotFile}
                  onContinue={continueFromJobContext}
                />
              )}

              {workflowState === "cv_or_profile_context" && (
                <ContextStep
                  cvMode={cvMode}
                  cvFile={cvFile}
                  setCvFile={setCvFile}
                  brainDump={brainDump}
                  setBrainDump={setBrainDump}
                  onSwitchToScratch={() => {
                    setCvMode("scratch");
                    addMessage("assistant", "Switched to start from scratch. Give me a compact brain dump and I’ll structure it.");
                  }}
                  onProcess={processContext}
                  isBusy={isBusy}
                />
              )}

              {workflowState === "processing_context" && (
                <motion.div layout className="rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#18292f]">Processing Career Vault</p>
                      <p className="mt-1 text-sm text-[#6e7d82]">Extracting EvidenceItems, creating embeddings, and ranking role fit.</p>
                    </div>
                    <ThinkingIndicator />
                  </div>
                </motion.div>
              )}

              {workflowState === "ai_followup_questions" && (
                <>
                  <div className="rounded-2xl border border-[#dfe8e7] bg-white/[0.72] p-4 text-sm text-[#31474d]">
                    Career Vault signal: {evidenceItems.length} EvidenceItems extracted. {retrieval?.label}
                  </div>
                  <FollowUpStep questions={followUpQuestions} answers={followUpAnswers} setAnswers={setFollowUpAnswers} onSubmit={createPlan} />
                </>
              )}

              {workflowState === "job_fit_plan" && plan && <JobFitPlanCard plan={plan} retrieval={retrieval} onGenerate={generateCv} />}

              {workflowState === "generating_cv" && (
                <motion.div layout className="rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#18292f]">Generating tailored CV</p>
                      <p className="mt-1 text-sm text-[#6e7d82]">Writing one page, then checking claims against the Evidence Vault.</p>
                    </div>
                    <ThinkingIndicator />
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            cvResult && (
              <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
                <section className="proofcv-ui space-y-4">
                  <div className="rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
                    <p className="text-sm font-semibold text-[#18292f]">Conversation</p>
                    <div className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-2">
                      {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} />
                      ))}
                    </div>
                  </div>
                  {plan && <JobFitPlanCard plan={plan} retrieval={retrieval} onGenerate={generateCv} />}
                  <VerificationPanel verification={cvResult.verification} />
                  <div className="rounded-[1.5rem] border border-[#dfe8e7] bg-white p-4">
                    <p className="text-sm font-semibold text-[#18292f]">Ask for changes</p>
                    <textarea
                      value={editInstruction}
                      onChange={(event) => setEditInstruction(event.target.value)}
                      rows={4}
                      placeholder="e.g. Make the summary more technical, but do not exaggerate."
                      className="mt-3 w-full resize-y rounded-2xl border border-[#dfe8e7] p-3 text-sm outline-none focus:border-[#18292f] focus:ring-4 focus:ring-[#b8eef6]/35"
                    />
                    <button
                      type="button"
                      disabled={isBusy || !editInstruction.trim()}
                      onClick={editCv}
                      className="mt-3 rounded-full bg-[#18292f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply edit
                    </button>
                  </div>
                </section>
                <aside className="space-y-4">
                  <div className="proofcv-ui rounded-[1.8rem] border border-white/75 bg-white/[0.88] p-5 shadow-[0_24px_90px_-62px_rgba(20,42,48,0.55)]">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#18292f]">Your tailored CV is ready.</p>
                        <p className="mt-1 text-xs text-[#6e7d82]">Fill contact details before export if you want them included.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => window.print()} className="rounded-full bg-[#18292f] px-4 py-2 text-sm font-semibold text-white">PDF</button>
                        <button type="button" onClick={exportDocx} className="rounded-full border border-[#d5e1df] bg-white px-4 py-2 text-sm font-semibold text-[#18292f]">DOCX</button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cvResult.cv.atsText);
                            toast.success("ATS text copied.");
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-[#d5e1df] bg-white px-4 py-2 text-sm font-semibold text-[#18292f]"
                        >
                          <ClipboardCopyIcon />
                          Copy ATS
                        </button>
                      </div>
                    </div>
                    <CvPreview cv={cvResult.cv} />
                    <p className="mt-4 text-xs leading-5 text-[#6e7d82]">
                      Review your CV before applying. ProofCV helps tailor your application but does not guarantee interviews or offers.
                    </p>
                  </div>
                </aside>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
