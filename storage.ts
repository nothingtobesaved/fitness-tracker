import { createInitialState, DAILY_BASICS, SCHEDULE } from "./seed";
import type { AppState } from "./types";

const STORAGE_KEY = "hunter-squad:olympus-ascendant:v1";

/**
 * A single persistence boundary for the whole application.
 * Pages never touch localStorage directly. The same interface can later be
 * backed by Supabase without rewriting page components.
 */
export interface HunterRepository {
  load(): AppState;
  save(state: AppState): void;
  clear(): void;
  available(): boolean;
}

function isStorageAvailable(): boolean {
  try {
    const probe = "__hunter_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const MAX_TRUSTED_AWAY_MS = 6 * 60 * 60 * 1000;

/**
 * A page can be left open or a device closed while the working timer runs.
 * Never trust a resumed timestamp older than six hours: keep the time already
 * accumulated, cap a runaway interval, and return the chamber to paused so it
 * cannot silently accumulate an absurd working duration.
 */
function normalizeWorkout(workout: AppState["activeWorkout"] | undefined): AppState["activeWorkout"] {
  if (!workout || typeof workout !== "object") {
    return { sessionId: null, status: "idle", accumulatedMs: 0, resumedAt: null };
  }
  const accumulatedMs = Number.isFinite(workout.accumulatedMs) ? Math.max(0, workout.accumulatedMs) : 0;
  const resumedAt = Number.isFinite(workout.resumedAt) ? (workout.resumedAt as number) : null;
  if (workout.status === "running" && resumedAt) {
    const away = Date.now() - resumedAt;
    if (away > MAX_TRUSTED_AWAY_MS) {
      return {
        sessionId: workout.sessionId,
        status: "paused",
        accumulatedMs: Math.min(MAX_TRUSTED_AWAY_MS, accumulatedMs + Math.max(0, away)),
        resumedAt: null,
      };
    }
    return { ...workout, accumulatedMs, resumedAt, status: "running" };
  }
  return {
    sessionId: workout.sessionId ?? null,
    status: workout.status === "paused" ? "paused" : "idle",
    accumulatedMs,
    resumedAt: null,
  };
}

/**
 * Normalizes stored data so a partially written or older record can never
 * crash a page. New schedule exercises are merged from the current protocol
 * while preserving any edits the hunter has made.
 */
function normalize(raw: Partial<AppState> | null): AppState {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;

  const schedule = Array.isArray(raw.schedule) && raw.schedule.length ? raw.schedule : base.schedule;
  const members = Array.isArray(raw.members) && raw.members.length ? raw.members : base.members;
  const ids = new Set(members.map((member) => member.id));

  return {
    ...base,
    ...raw,
    version: 1,
    dataMode: "local",
    activeMemberId: ids.has(raw.activeMemberId ?? "") ? (raw.activeMemberId as string) : base.activeMemberId,
    members,
    schedule: schedule.map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises : [],
    })),
    dailyBasics: Array.isArray(raw.dailyBasics) && raw.dailyBasics.length ? raw.dailyBasics : DAILY_BASICS,
    supplementary: Array.isArray(raw.supplementary) ? raw.supplementary : [],
    completions: raw.completions && typeof raw.completions === "object" ? raw.completions : {},
    completedDays:
      raw.completedDays && typeof raw.completedDays === "object"
        ? { alkais: [], nikos: [], ...raw.completedDays }
        : base.completedDays,
    log: Array.isArray(raw.log) ? raw.log : base.log,
    plannedMinutes: [10, 15, 20, 30].includes(Number(raw.plannedMinutes)) ? Number(raw.plannedMinutes) : 20,
    cameraConsent: Boolean(raw.cameraConsent),
    activeWorkout: normalizeWorkout(raw.activeWorkout),
    lastSummary: raw.lastSummary ?? null,
    seededAt: raw.seededAt ?? base.seededAt,
  };
}

export const localHunterRepository: HunterRepository = {
  available: isStorageAvailable,
  load() {
    if (!isStorageAvailable()) return createInitialState();
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const initial = createInitialState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return normalize(JSON.parse(stored) as Partial<AppState>);
    } catch {
      return createInitialState();
    }
  },
  save(state: AppState) {
    if (!isStorageAvailable()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("[Hunter Squad] Unable to persist local record.", error);
    }
  },
  clear() {
    if (!isStorageAvailable()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export const STORAGE_META = {
  key: STORAGE_KEY,
  modeLabel: "Local demo mode",
  schemaNote: "One local record per browser. Seeded demo totals are labelled; exercise entries are recorded only when completed.",
  defaultSchedule: SCHEDULE,
};

export function exportState(state: AppState) {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), application: "Hunter Squad: Olympus Ascendant", ...state }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hunter-squad-record-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
