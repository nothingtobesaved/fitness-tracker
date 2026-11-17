export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export type ExerciseUnit = "reps" | "seconds" | "minutes" | "meters";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  durationSec?: number;
  distance?: number;
  unit?: ExerciseUnit;
  restSec: number;
  cues?: string;
  optional?: boolean;
  source?: "protocol" | "custom";
}

export type SessionType = "Strength" | "Mobility" | "Conditioning" | "Recovery" | "Endurance";

export type DayShort = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface Session {
  id: string;
  day: DayShort;
  title: string;
  focus: string;
  type: SessionType;
  minutes: number;
  exercises: Exercise[];
  note?: string;
  recovery?: boolean;
}

export interface BasicDrill {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  sets: number;
  reps: string;
  restSec: number;
  icon: string;
}

export interface MemberSeed {
  id: string;
  name: string;
  handle: string;
  monogram: string;
  title: string;
  baseXp: number;
  baseWeeklyXp: number;
  baseSeconds: number;
  baseMissions: number;
  joined: string;
}

export type ActivityKind = "mission" | "exercise" | "session" | "basics" | "recovery" | "achievement";

export interface ActivityEntry {
  id: string;
  memberId: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  xp: number;
  seconds: number;
  at: string;
  ref?: string;
  seed?: boolean;
}

export type CompletionSource = "session" | "basics" | "recovery" | "supplementary";

export interface Completion {
  memberId: string;
  date: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  source: CompletionSource;
  xp: number;
  seconds: number;
}

export interface ActiveWorkout {
  sessionId: string | null;
  status: "idle" | "running" | "paused";
  accumulatedMs: number;
  resumedAt: number | null;
}

export interface WorkoutSummary {
  id: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  memberId: string;
  completed: number;
  total: number;
  seconds: number;
  xp: number;
  missionComplete: boolean;
  finishedAt: string;
}

export interface AppState {
  version: number;
  dataMode: "local";
  activeMemberId: string;
  members: MemberSeed[];
  schedule: Session[];
  dailyBasics: BasicDrill[];
  supplementary: Exercise[];
  completions: Record<string, Completion>;
  completedDays: Record<string, string[]>;
  log: ActivityEntry[];
  plannedMinutes: number;
  cameraConsent: boolean;
  activeWorkout: ActiveWorkout;
  lastSummary: WorkoutSummary | null;
  seededAt: string;
}

export interface MemberStats {
  member: MemberSeed;
  totalXp: number;
  weeklyXp: number;
  totalSeconds: number;
  completedMissions: number;
  level: number;
  rank: Rank;
  nextRank: Rank | null;
  rankProgress: number;
  rankFloor: number;
  nextRankXp: number | null;
  levelProgress: number;
  xpToNextLevel: number;
  totalLocalXp: number;
  streak: number;
  weeklyDays: boolean[];
  weeklyConsistency: number;
  monthlyConsistency: number;
  localMissions: number;
  localExerciseSeconds: number;
  localBasics: number;
}
