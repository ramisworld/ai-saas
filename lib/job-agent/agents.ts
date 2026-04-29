import { aiConfig, generateJson } from "@/lib/job-agent/ai";
import type {
  CareerEvidence,
  CareerProfile,
  GeneratedDocuments,
  MatchAnalysis,
  ParsedJob,
} from "@/lib/job-agent/types";

const TRUTHFULNESS_RULES = [
  "Do not fabricate experience, credentials, employers, dates, tools, or outcomes.",
  "Only use candidate claims that appear in the supplied career evidence.",
  "If evidence is missing, mark it as a gap instead of inventing a substitute.",
  "Keep language specific, concise, and suitable for job applications.",
].join("\n");

function evidenceText(evidence: CareerEvidence[]) {
  return evidence
    .map((item, index) => {
      return `Evidence ${index + 1} (${item.title || item.sourceType || "Career source"}, score ${item.score.toFixed(3)}):\n${item.text}`;
    })
    .join("\n\n");
}

export async function parseJobPosting(input: {
  targetRole: string;
  jobText?: string | null;
  jobUrl?: string | null;
}) {
  const result = await generateJson<{ job: ParsedJob }>({
    model: aiConfig.fastModel,
    system: `You are the Job Parser Agent for ProofCV. Return strict JSON only. Extract practical job-application details. If the user only supplied a role, infer cautiously and set confidence below 65.`,
    user: `Target role:
${input.targetRole}

Job URL if provided:
${input.jobUrl || "None"}

Job post text if provided:
${input.jobText || "No exact job post supplied."}

Return:
{
  "job": {
    "company": string | null,
    "roleTitle": string,
    "seniority": string | null,
    "requiredSkills": string[],
    "niceToHaveSkills": string[],
    "responsibilities": string[],
    "atsKeywords": string[],
    "interviewThemes": string[],
    "hiddenExpectations": string[],
    "confidence": number from 0 to 100
  }
}`,
  });

  return result.job;
}

export async function extractCareerProfile(input: {
  profileText: string;
  targetRole: string;
}) {
  const result = await generateJson<{ profile: CareerProfile; completeness: number }>({
    model: aiConfig.fastModel,
    system: `You are the Career Vault Parser Agent for ProofCV. Return strict JSON only. Extract the user's real background from their CV/profile notes. ${TRUTHFULNESS_RULES}`,
    user: `Target role:
${input.targetRole}

Candidate CV/profile/context:
${input.profileText}

Return:
{
  "profile": {
    "summary": string,
    "currentRole": string | null,
    "skills": string[],
    "projects": [{"name": string, "description": string, "technologies": string[], "outcomes": string[]}],
    "experience": [{"role": string, "company": string | null, "highlights": string[]}],
    "education": string[],
    "certifications": string[],
    "achievements": string[],
    "goals": string[]
  },
  "completeness": number from 0 to 100
}`,
  });

  return result;
}

export async function calculateMatchScore(input: {
  parsedJob: ParsedJob;
  evidence: CareerEvidence[];
}) {
  const result = await generateJson<{ match: MatchAnalysis }>({
    model: aiConfig.fastModel,
    system: `You are the Candidate Match Agent for ProofCV. Return strict JSON only. Use the job requirements and candidate evidence to calculate an honest match. ${TRUTHFULNESS_RULES}`,
    user: `Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Retrieved career evidence:
${evidenceText(input.evidence)}

Return:
{
  "match": {
    "matchScore": number from 0 to 100,
    "strongMatches": string[],
    "weakSpots": string[],
    "missingSkills": string[],
    "suggestedEmphasis": string[],
    "reasoning": string
  }
}`,
  });

  return result.match;
}

export async function generateTailoredCV(input: {
  parsedJob: ParsedJob;
  profile: CareerProfile;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
}) {
  const result = await generateJson<{ tailoredCv: string }>({
    model: aiConfig.textModel,
    system: `You are the CV Tailoring Agent for ProofCV. Return strict JSON only. Write a tailored CV draft in Markdown. ${TRUTHFULNESS_RULES}`,
    user: `Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Structured profile:
${JSON.stringify(input.profile, null, 2)}

Match analysis:
${JSON.stringify(input.match, null, 2)}

Retrieved evidence:
${evidenceText(input.evidence)}

Return:
{
  "tailoredCv": "Markdown CV draft. Include a short evidence-based profile, skills, relevant projects/experience, education/certifications where available, and a final 'Review notes' section for gaps. Do not invent facts."
}`,
  });

  return result.tailoredCv;
}

export async function generateCoverLetter(input: {
  parsedJob: ParsedJob;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
}) {
  const result = await generateJson<{ coverLetter: string }>({
    model: aiConfig.textModel,
    system: `You are the Cover Letter Agent for ProofCV. Return strict JSON only. Write concise, role-specific cover letters with no generic corporate fluff. ${TRUTHFULNESS_RULES}`,
    user: `Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Match analysis:
${JSON.stringify(input.match, null, 2)}

Retrieved evidence:
${evidenceText(input.evidence)}

Return:
{
  "coverLetter": "Markdown cover letter, 250-400 words, tailored to the role/company, honest about evidence."
}`,
  });

  return result.coverLetter;
}

export async function generateRecruiterMessage(input: {
  parsedJob: ParsedJob;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
}) {
  const result = await generateJson<{ recruiterMessage: string }>({
    model: aiConfig.fastModel,
    system: `You are the Recruiter Message Agent for ProofCV. Return strict JSON only. Write a short confident LinkedIn/email message. ${TRUTHFULNESS_RULES}`,
    user: `Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Match analysis:
${JSON.stringify(input.match, null, 2)}

Retrieved evidence:
${evidenceText(input.evidence)}

Return:
{
  "recruiterMessage": "Short message under 120 words."
}`,
  });

  return result.recruiterMessage;
}

export async function generateInterviewPrep(input: {
  parsedJob: ParsedJob;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
}) {
  const result = await generateJson<{ interviewPrep: string }>({
    model: aiConfig.textModel,
    system: `You are the Interview Prep Agent for ProofCV. Return strict JSON only. Build practical interview preparation grounded in evidence. ${TRUTHFULNESS_RULES}`,
    user: `Parsed job:
${JSON.stringify(input.parsedJob, null, 2)}

Match analysis:
${JSON.stringify(input.match, null, 2)}

Retrieved evidence:
${evidenceText(input.evidence)}

Return:
{
  "interviewPrep": "Markdown prep pack with likely technical questions, behavioral questions, project talking points, weak-area prep, and role-specific themes."
}`,
  });

  return result.interviewPrep;
}

export async function generateApplicationDocuments(input: {
  parsedJob: ParsedJob;
  profile: CareerProfile;
  match: MatchAnalysis;
  evidence: CareerEvidence[];
}): Promise<GeneratedDocuments> {
  const [tailoredCv, coverLetter, recruiterMessage, interviewPrep] = await Promise.all([
    generateTailoredCV(input),
    generateCoverLetter(input),
    generateRecruiterMessage(input),
    generateInterviewPrep(input),
  ]);

  return {
    tailoredCv,
    coverLetter,
    recruiterMessage,
    interviewPrep,
  };
}
