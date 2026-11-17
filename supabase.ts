/**
 * SUPABASE INTEGRATION SCAFFOLD
 * ---------------------------------------------------------------
 * The first release runs entirely on the local repository in storage.ts.
 * This module defines the remote boundary so it can be enabled without
 * changing any page component.
 *
 * Security rules:
 *  - Only a Supabase URL and the anon/publishable key may reach the frontend.
 *  - Never put a service-role key in this file, an env var prefixed VITE_,
 *    the repository, or GitHub Pages.
 *  - Row Level Security must be enabled before any table is read or written.
 *  - Video proof stays private and is never recorded or uploaded by this build.
 */

export const SUPABASE_ENV_KEYS = {
  url: "VITE_SUPABASE_URL",
  anonKey: "VITE_SUPABASE_ANON_KEY",
} as const;

type EnvRecord = Record<string, string | undefined>;
const env = ((import.meta as unknown as { env?: EnvRecord }).env ?? {}) as EnvRecord;

declare global {
  interface Window {
    HUNTER_SUPABASE_CONFIG?: { url?: string; anonKey?: string };
  }
}

const runtimeConfig =
  typeof window !== "undefined" && window.HUNTER_SUPABASE_CONFIG ? window.HUNTER_SUPABASE_CONFIG : undefined;

export const supabaseConfig = {
  url: (runtimeConfig?.url || env[SUPABASE_ENV_KEYS.url] || "").replace(/\/$/, ""),
  anonKey: runtimeConfig?.anonKey || env[SUPABASE_ENV_KEYS.anonKey] || "",
};

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

export const SQUAD_TABLES = {
  profiles: "hunter_profiles",
  squads: "squads",
  squadMembers: "squad_members",
  missions: "missions",
  missionExercises: "mission_exercises",
  exerciseRecords: "exercise_records",
  dailyCheckins: "daily_checkins",
  activity: "squad_activity",
  xpLedger: "xp_ledger",
} as const;

export interface RemoteProfile {
  id: string;
  display_name: string;
  handle: string;
  rank: string;
  level: number;
  lifetime_xp: number;
  weekly_xp: number;
  total_exercise_seconds: number;
  completed_missions: number;
  current_streak: number;
}

export interface RemoteSquadSnapshot {
  profiles: RemoteProfile[];
  activity: Record<string, unknown>[];
  completedDays: Record<string, string[]>;
  source: "supabase";
  fetchedAt: string;
}

/** Row types intentionally mirror the SQL schema documented in README.md. */
export interface RemoteExerciseRecord {
  id?: string;
  squad_id: string;
  member_id: string;
  mission_id: string;
  exercise_id: string;
  exercise_name: string;
  completed_on: string;
  xp_awarded: number;
  seconds_awarded: number;
  source: "session" | "basics" | "recovery" | "supplementary";
}

export interface HunterRemoteRepository {
  readonly mode: "supabase";
  pullSquad(squadId: string): Promise<RemoteSquadSnapshot>;
  pushExerciseRecord(record: RemoteExerciseRecord): Promise<void>;
  markMissionComplete(memberId: string, squadId: string, missionId: string, completedOn: string): Promise<void>;
  signIn(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  signOut(): Promise<void>;
}

function requireConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time, then apply the schema and RLS policies from README.md.",
    );
  }
}

type StoredSession = { accessToken: string; refreshToken: string };

const AUTH_TOKEN_KEY = "hunter-squad:supabase-session";

function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string"
      ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
      : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

function authHeaders(accessToken?: string): HeadersInit {
  return {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${accessToken || supabaseConfig.anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function refreshStoredSession(): Promise<StoredSession | null> {
  const current = readStoredSession();
  if (!current?.refreshToken) return null;

  const response = await fetch(`${supabaseConfig.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: supabaseConfig.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current.refreshToken }),
  });
  if (!response.ok) {
    clearStoredSession();
    return null;
  }
  const refreshed = (await response.json()) as { access_token?: string; refresh_token?: string };
  if (!refreshed.access_token || !refreshed.refresh_token) {
    clearStoredSession();
    return null;
  }
  const next = { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token };
  writeStoredSession(next);
  return next;
}

async function restRequest<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  requireConfiguration();
  const stored = accessToken ? null : readStoredSession();
  const token = accessToken || stored?.accessToken;
  const request = (bearer?: string) =>
    fetch(`${supabaseConfig.url}/rest/v1/${path}`, {
      ...init,
      headers: { ...authHeaders(bearer), ...(init.headers ?? {}) },
    });

  let response = await request(token);
  if (response.status === 401 && !accessToken && stored?.refreshToken) {
    const refreshed = await refreshStoredSession();
    if (refreshed) response = await request(refreshed.accessToken);
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${message.slice(0, 240)}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Minimal REST gateway. The app remains local-first until the UI is explicitly
 * wired to this repository; these methods do not silently change local mode.
 */
export function createHunterRemoteRepository(): HunterRemoteRepository {
  return {
    mode: "supabase",

    async pullSquad(squadId) {
      requireConfiguration();
      const membershipQuery = new URLSearchParams({ select: "member_id", squad_id: `eq.${squadId}` });
      const memberships = await restRequest<Array<{ member_id: string }>>(
        `${SQUAD_TABLES.squadMembers}?${membershipQuery.toString()}`,
      );
      const memberIds = memberships.map((membership) => membership.member_id).filter(Boolean);
      const profiles = memberIds.length
        ? await restRequest<RemoteProfile[]>(
            `${SQUAD_TABLES.profiles}?${new URLSearchParams({
              select: "*",
              id: `in.(${memberIds.join(",")})`,
            }).toString()}`,
          )
        : [];
      const activityQuery = new URLSearchParams({
        select: "*",
        squad_id: `eq.${squadId}`,
        order: "created_at.desc",
        limit: "50",
      });
      const activity = await restRequest<Record<string, unknown>[]>(
        `${SQUAD_TABLES.activity}?${activityQuery.toString()}`,
      );
      return {
        profiles,
        activity,
        completedDays: {},
        source: "supabase",
        fetchedAt: new Date().toISOString(),
      };
    },

    async pushExerciseRecord(record) {
      const query = new URLSearchParams({ on_conflict: "member_id,exercise_id,completed_on" });
      await restRequest(`${SQUAD_TABLES.exerciseRecords}?${query.toString()}`, {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify(record),
      });
    },

    async markMissionComplete(memberId, squadId, missionId, completedOn) {
      const query = new URLSearchParams({ on_conflict: "member_id,completed_on,mission_id" });
      await restRequest(`${SQUAD_TABLES.dailyCheckins}?${query.toString()}`, {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          member_id: memberId,
          squad_id: squadId,
          mission_id: missionId,
          completed_on: completedOn,
          mission_completed: true,
        }),
      });
    },

    async signIn(email, password) {
      requireConfiguration();
      const response = await fetch(`${supabaseConfig.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: supabaseConfig.anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("Supabase sign-in failed. Check the account credentials and email confirmation.");
      const session = (await response.json()) as { access_token?: string; refresh_token?: string };
      if (!session.access_token || !session.refresh_token) {
        throw new Error("Supabase sign-in returned an incomplete session.");
      }
      const storedSession = { accessToken: session.access_token, refreshToken: session.refresh_token };
      writeStoredSession(storedSession);
      return storedSession;
    },

    async signOut() {
      const session = readStoredSession();
      try {
        if (session?.accessToken && isSupabaseConfigured) {
          const response = await fetch(`${supabaseConfig.url}/auth/v1/logout`, {
            method: "POST",
            headers: {
              apikey: supabaseConfig.anonKey,
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          if (!response.ok && response.status !== 401) {
            throw new Error(`Supabase sign-out failed (${response.status}).`);
          }
        }
      } finally {
        clearStoredSession();
      }
    },
  };
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: "Local demo mode. Add your Supabase project URL and anon key, then rebuild the site.",
    };
  }
  try {
    await restRequest(`${SQUAD_TABLES.squads}?select=id&limit=1`);
    return { ok: true, message: "Connected. Row Level Security controls what this session can read." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Connection test failed." };
  }
}

export const DATA_MODE = isSupabaseConfigured ? "supabase" : "local";
