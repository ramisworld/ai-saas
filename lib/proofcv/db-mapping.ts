import {
  EvidenceConfidence,
  EvidenceItemSource,
  EvidenceItemType,
  ProofCvMode,
  ProofCvSessionStatus,
} from "@prisma/client";

import type { CvMode, ProofCvEvidenceItem, WorkflowState } from "@/lib/proofcv/schemas";

export function toDbCvMode(mode: CvMode) {
  return mode === "existing_cv" ? ProofCvMode.EXISTING_CV : ProofCvMode.SCRATCH;
}

export function toDbStatus(state: WorkflowState) {
  const map: Record<WorkflowState, ProofCvSessionStatus> = {
    landing: ProofCvSessionStatus.LANDING,
    auth_gate: ProofCvSessionStatus.AUTH_GATE,
    job_context: ProofCvSessionStatus.JOB_CONTEXT,
    cv_or_profile_context: ProofCvSessionStatus.CV_OR_PROFILE_CONTEXT,
    processing_context: ProofCvSessionStatus.PROCESSING_CONTEXT,
    ai_followup_questions: ProofCvSessionStatus.AI_FOLLOWUP_QUESTIONS,
    job_fit_plan: ProofCvSessionStatus.JOB_FIT_PLAN,
    generating_cv: ProofCvSessionStatus.GENERATING_CV,
    cv_editor: ProofCvSessionStatus.CV_EDITOR,
    export_ready: ProofCvSessionStatus.EXPORT_READY,
  };

  return map[state];
}

export function toDbEvidenceType(type: ProofCvEvidenceItem["type"]) {
  const map: Record<ProofCvEvidenceItem["type"], EvidenceItemType> = {
    project: EvidenceItemType.PROJECT,
    skill: EvidenceItemType.SKILL,
    work_experience: EvidenceItemType.WORK_EXPERIENCE,
    education: EvidenceItemType.EDUCATION,
    certification: EvidenceItemType.CERTIFICATION,
    achievement: EvidenceItemType.ACHIEVEMENT,
    tool: EvidenceItemType.TOOL,
    goal: EvidenceItemType.GOAL,
  };

  return map[type];
}

export function fromDbEvidenceType(type: EvidenceItemType): ProofCvEvidenceItem["type"] {
  const map: Record<EvidenceItemType, ProofCvEvidenceItem["type"]> = {
    PROJECT: "project",
    SKILL: "skill",
    WORK_EXPERIENCE: "work_experience",
    EDUCATION: "education",
    CERTIFICATION: "certification",
    ACHIEVEMENT: "achievement",
    TOOL: "tool",
    GOAL: "goal",
  };

  return map[type];
}

export function toDbEvidenceSource(source: ProofCvEvidenceItem["source"]) {
  const map: Record<ProofCvEvidenceItem["source"], EvidenceItemSource> = {
    uploaded_cv: EvidenceItemSource.UPLOADED_CV,
    user_brain_dump: EvidenceItemSource.USER_BRAIN_DUMP,
    followup_answer: EvidenceItemSource.FOLLOWUP_ANSWER,
    generated_correction: EvidenceItemSource.GENERATED_CORRECTION,
  };

  return map[source];
}

export function fromDbEvidenceSource(source: EvidenceItemSource): ProofCvEvidenceItem["source"] {
  const map: Record<EvidenceItemSource, ProofCvEvidenceItem["source"]> = {
    UPLOADED_CV: "uploaded_cv",
    USER_BRAIN_DUMP: "user_brain_dump",
    FOLLOWUP_ANSWER: "followup_answer",
    GENERATED_CORRECTION: "generated_correction",
  };

  return map[source];
}

export function toDbEvidenceConfidence(confidence: ProofCvEvidenceItem["confidence"]) {
  const map: Record<ProofCvEvidenceItem["confidence"], EvidenceConfidence> = {
    confirmed: EvidenceConfidence.CONFIRMED,
    inferred: EvidenceConfidence.INFERRED,
    needs_confirmation: EvidenceConfidence.NEEDS_CONFIRMATION,
  };

  return map[confidence];
}

export function fromDbEvidenceConfidence(confidence: EvidenceConfidence): ProofCvEvidenceItem["confidence"] {
  const map: Record<EvidenceConfidence, ProofCvEvidenceItem["confidence"]> = {
    CONFIRMED: "confirmed",
    INFERRED: "inferred",
    NEEDS_CONFIRMATION: "needs_confirmation",
  };

  return map[confidence];
}
