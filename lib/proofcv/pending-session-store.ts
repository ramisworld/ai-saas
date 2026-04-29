import { pendingSessionSchema, type CvMode, type PendingSession } from "@/lib/proofcv/schemas";

const STORAGE_KEY = "proofcv.pending-session.v1";

function storage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pending_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export interface PendingSessionStore {
  save(input: {
    targetRoleRaw: string;
    cvMode: CvMode;
    cvFileMeta?: PendingSession["cvFileMeta"];
  }): PendingSession;
  read(): PendingSession | null;
  clear(): void;
}

export const browserPendingSessionStore: PendingSessionStore = {
  save(input) {
    const pendingSession: PendingSession = {
      id: createId(),
      targetRoleRaw: input.targetRoleRaw,
      cvMode: input.cvMode,
      cvFileMeta: input.cvFileMeta || null,
      createdAt: new Date().toISOString(),
    };

    storage()?.setItem(STORAGE_KEY, JSON.stringify(pendingSession));

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSession));
    }

    return pendingSession;
  },
  read() {
    const raw = storage()?.getItem(STORAGE_KEY);
    const fallback = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;

    if (!raw && !fallback) {
      return null;
    }

    try {
      const parsed = pendingSessionSchema.safeParse(JSON.parse(raw || fallback || "{}"));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
  clear() {
    storage()?.removeItem(STORAGE_KEY);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  },
};
