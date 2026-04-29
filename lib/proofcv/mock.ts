import type {
  FollowUpQuestion,
  JobFitPlan,
  ParsedJobContext,
  ProofCvEvidenceItem,
  TailoredCv,
  VerificationReport,
} from "@/lib/proofcv/schemas";

function roleParts(targetRoleRaw: string) {
  const match = targetRoleRaw.match(/(.+?)\s+(?:at|@)\s+(.+)/i);

  if (!match) {
    return {
      role: targetRoleRaw.trim() || "Target role",
      company: null,
    };
  }

  return {
    role: match[1].trim(),
    company: match[2].trim(),
  };
}

export function mockParsedJob(targetRoleRaw: string, specificity: ParsedJobContext["specificity"]): ParsedJobContext {
  const parts = roleParts(targetRoleRaw);
  const roleLower = parts.role.toLowerCase();
  const isTechnical = /engineer|developer|architect|data|ai|software|analyst/.test(roleLower);

  return {
    targetCompany: parts.company,
    targetRole: parts.role,
    seniorityLevel: /senior|lead|principal|architect|manager/i.test(parts.role) ? "senior or leadership-leaning" : "early to mid-career",
    requirements: isTechnical
      ? ["Relevant project evidence", "Clear technical skills", "Problem solving", "Communication", "Delivery ownership"]
      : ["Relevant experience", "Communication", "Commercial awareness", "Execution", "Stakeholder collaboration"],
    keywords: isTechnical
      ? ["systems", "delivery", "technical decisions", "evaluation", "tooling"]
      : ["strategy", "execution", "stakeholders", "analysis", "outcomes"],
    responsibilities: isTechnical
      ? ["Design and build role-relevant systems", "Explain tradeoffs", "Work across ambiguity", "Ship reliable work"]
      : ["Understand user or business needs", "Coordinate work", "Prioritize outcomes", "Communicate clearly"],
    companyTone: parts.company ? "specific and outcome-focused" : "general role-focused",
    mustHaveSkills: isTechnical ? ["technical execution", "structured problem solving", "clear documentation"] : ["communication", "organization", "evidence of outcomes"],
    niceToHaveSkills: isTechnical ? ["evaluation", "architecture decisions", "deployment awareness"] : ["analytics", "process improvement", "customer empathy"],
    specificity,
  };
}

export function mockEvidenceItems(input: {
  targetRoleRaw: string;
  source: ProofCvEvidenceItem["source"];
  text: string;
}): ProofCvEvidenceItem[] {
  const parts = roleParts(input.targetRoleRaw);
  const compactText = input.text.trim().slice(0, 360);

  return [
    {
      type: "project",
      title: `${parts.role} aligned project evidence`,
      description:
        compactText ||
        "User-provided context describing relevant projects, skills, tools, and application goals.",
      tools: ["tools from user context"],
      skills: ["role alignment", "communication", "delivery"],
      impact: "Impact should be quantified by the user before export if exact numbers matter.",
      source: input.source,
      confidence: input.text.trim() ? "inferred" : "needs_confirmation",
      proofStrength: input.text.trim() ? 70 : 35,
      senioritySignal: "Shows practical delivery signal, seniority depends on confirmed scope.",
      needsUserConfirmation: !input.text.trim(),
    },
    {
      type: "skill",
      title: "Transferable role skills",
      description: `Skills that can be positioned for ${parts.role}, based on the supplied context.`,
      tools: [],
      skills: ["problem framing", "structured communication", "learning speed"],
      impact: null,
      source: input.source,
      confidence: "inferred",
      proofStrength: 55,
      senioritySignal: "General capability signal.",
      needsUserConfirmation: true,
    },
  ];
}

export function mockFollowUpQuestions(targetRoleRaw: string): FollowUpQuestion[] {
  const parts = roleParts(targetRoleRaw);

  return [
    {
      id: "q1",
      question: `What is the strongest project or experience you have that proves you can do ${parts.role} work?`,
      rationale: "This anchors the CV in concrete evidence.",
    },
    {
      id: "q2",
      question: "Which tools, platforms, or methods did you personally use, and what did you actually build or deliver?",
      rationale: "This prevents vague keyword stuffing.",
    },
    {
      id: "q3",
      question: "Do you have any measurable result, user outcome, speed improvement, grade, award, or stakeholder feedback from that work?",
      rationale: "Recruiters respond to proof and outcomes.",
    },
    {
      id: "q4",
      question: "What should I avoid overstating because you have not done it in a real or production setting?",
      rationale: "This protects the CV from unsupported claims.",
    },
  ];
}

export function mockJobFitPlan(targetRoleRaw: string, evidenceTitles: string[]): JobFitPlan {
  const parts = roleParts(targetRoleRaw);

  return {
    target: parts.company ? `${parts.role} at ${parts.company}` : parts.role,
    caresAbout: ["role-specific proof", "clear ownership", "relevant tools", "credible outcomes", "concise communication"],
    strongestEvidence: evidenceTitles.length ? evidenceTitles : ["Career Vault evidence supplied by the user"],
    gapsAndRisks: [
      "Avoid claiming production-scale work unless the user confirmed it.",
      "Avoid named company or tool expertise unless it appears in the Evidence Vault.",
      "Keep metrics out unless the user supplied them.",
    ],
    strategy:
      "Position the CV around the closest real evidence, use a concise summary, prioritize selected projects or experience, and keep claims specific enough to be credible.",
  };
}

export function mockTailoredCv(input: {
  targetRoleRaw: string;
  plan: JobFitPlan;
  evidenceItems: Array<ProofCvEvidenceItem & { id: string }>;
}): TailoredCv {
  const parts = roleParts(input.targetRoleRaw);
  const evidenceIds = input.evidenceItems.map((item) => item.id);
  const firstEvidence = input.evidenceItems[0];
  const target = parts.company ? `${parts.role} at ${parts.company}` : parts.role;

  const sections = [
    {
      id: "summary",
      title: "Professional Summary",
      content: [
        `Emerging ${parts.role} candidate with practical evidence in ${firstEvidence?.skills.slice(0, 3).join(", ") || "role-relevant delivery"} and a focused interest in ${target}.`,
      ],
    },
    {
      id: "skills",
      title: "Core Skills",
      content: [
        input.plan.caresAbout.slice(0, 5).join(" | "),
        (firstEvidence?.tools || []).filter(Boolean).join(" | ") || "Tools to be confirmed from Career Vault",
      ],
    },
    {
      id: "experience",
      title: "Selected Projects / Experience",
      content: [
        `${firstEvidence?.title || "Relevant project"}: ${firstEvidence?.description || "Describe the strongest relevant evidence."}`,
        "Structured role-specific information into a concise, recruiter-readable application narrative.",
      ],
    },
    {
      id: "education",
      title: "Education",
      content: ["Education details from Career Vault or user confirmation."],
    },
    {
      id: "certifications",
      title: "Certifications",
      content: ["Certifications, courses, or portfolio links to be added if confirmed."],
    },
  ];

  return {
    header: {
      name: "Full Name",
      email: "Email",
      phone: "Phone",
      links: "LinkedIn / Portfolio",
    },
    sections,
    atsText: sections.map((section) => `${section.title}\n${section.content.join("\n")}`).join("\n\n"),
    evidenceMap: Object.fromEntries(sections.flatMap((section) => section.content.map((line) => [line, evidenceIds]))),
  };
}

export function mockVerification(cv: TailoredCv): VerificationReport {
  return {
    supported: cv.sections.flatMap((section) => section.content).slice(0, 3),
    needsConfirmation: ["Confirm exact contact details and any measurable outcomes before export."],
    rewritten: [
      {
        original: "Production-scale ownership",
        rewrite: "Hands-on project ownership, unless production scale is confirmed.",
      },
    ],
  };
}
