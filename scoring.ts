import type { Exercise, Rank } from "./types";

export const RANK_LADDER: { rank: Rank; minXp: number; title: string }[] = [
  { rank: "E", minXp: 0, title: "Unawakened" },
  { rank: "D", minXp: 3000, title: "Bronze Aspirant" },
  { rank: "C", minXp: 8000, title: "Silver Hunter" },
  { rank: "B", minXp: 14000, title: "Gold Hunter" },
  { rank: "A", minXp: 26000, title: "Olympian" },
  { rank: "S", minXp: 45000, title: "Ascendant" },
];

export const XP_PER_LEVEL = 360;

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
}

export function rankForXp(xp: number): Rank {
  let rank: Rank = "E";
  for (const entry of RANK_LADDER) {
    if (xp >= entry.minXp) rank = entry.rank;
  }
  return rank;
}

export function rankDetails(xp: number) {
  let index = 0;
  RANK_LADDER.forEach((entry, i) => {
    if (xp >= entry.minXp) index = i;
  });
  const current = RANK_LADDER[index];
  const next = RANK_LADDER[index + 1] ?? null;
  const span = next ? next.minXp - current.minXp : 1;
  const progress = next ? Math.min(1, Math.max(0, (xp - current.minXp) / span)) : 1;
  return {
    rank: current.rank,
    rankTitle: current.title,
    nextRank: next?.rank ?? null,
    nextRankXp: next?.minXp ?? null,
    rankFloor: current.minXp,
    rankProgress: progress,
  };
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const floor = (level - 1) * XP_PER_LEVEL;
  const progress = (xp - floor) / XP_PER_LEVEL;
  return { level, progress: Math.min(1, Math.max(0, progress)), xpToNextLevel: Math.ceil(level * XP_PER_LEVEL - xp) };
}

/** Working seconds credited to training volume, excluding rest. */
export function exerciseSeconds(exercise: Exercise): number {
  const sets = Math.max(1, exercise.sets || 1);
  if (exercise.durationSec) return Math.round(sets * exercise.durationSec);
  if (exercise.reps) return Math.round(sets * Math.max(20, exercise.reps * 3.5));
  if (exercise.distance) return Math.round(sets * Math.max(45, exercise.distance * 2));
  return sets * 45;
}

export function exerciseXp(exercise: Exercise): number {
  const minutes = exerciseSeconds(exercise) / 60;
  const raw = Math.round((minutes * 12) / 5) * 5;
  return Math.max(10, Math.min(90, raw));
}

export function exerciseDosage(exercise: Exercise): string {
  if (exercise.durationSec) {
    const mins = exercise.durationSec >= 60 ? `${Math.round(exercise.durationSec / 60)} min` : `${exercise.durationSec}s`;
    return `${exercise.sets} × ${mins}`;
  }
  if (exercise.distance) return `${exercise.sets} × ${exercise.distance}m`;
  return `${exercise.sets} × ${exercise.reps ?? 10}`;
}

export function exerciseRest(exercise: Exercise): string {
  if (!exercise.restSec) return "No rest";
  const mins = Math.floor(exercise.restSec / 60);
  const secs = exercise.restSec % 60;
  if (mins && secs) return `${mins}m ${secs}s rest`;
  if (mins) return `${mins}m rest`;
  return `${secs}s rest`;
}

export function missionBonus(minutes: number): number {
  const table: Record<number, number> = { 10: 75, 15: 100, 20: 150, 30: 200 };
  return table[minutes] ?? 120;
}

export const BASIC_XP = 10;

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: "streak" | "totalXp" | "missions" | "seconds" | "localMissions" | "localBasics" | "weeklyConsistency";
  threshold: number;
  suffix?: string;
  divine?: boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-oath",
    name: "The First Oath",
    description: "Complete a mission recorded on this device.",
    icon: "laurel",
    metric: "localMissions",
    threshold: 1,
  },
  {
    id: "seven-suns",
    name: "Seven Suns",
    description: "Hold an unbroken training streak of 7 days.",
    icon: "sun",
    metric: "streak",
    threshold: 7,
  },
  {
    id: "unbroken",
    name: "The Unbroken",
    description: "Carry a 21-day streak without yielding.",
    icon: "flame",
    metric: "streak",
    threshold: 21,
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Complete 100 missions across your hunter record.",
    icon: "trophy",
    metric: "missions",
    threshold: 100,
  },
  {
    id: "iron-hours",
    name: "Iron Hours",
    description: "Amass 10 hours of recorded exercise time.",
    icon: "clock",
    metric: "seconds",
    threshold: 36000,
    suffix: "s",
  },
  {
    id: "bronze-reserve",
    name: "Bronze Reserve",
    description: "Reach 10,000 lifetime XP.",
    icon: "spark",
    metric: "totalXp",
    threshold: 10000,
  },
  {
    id: "foundation-keeper",
    name: "Keeper of Foundations",
    description: "Complete 10 mobility basics on this device.",
    icon: "leaf",
    metric: "localBasics",
    threshold: 10,
  },
  {
    id: "perfect-week",
    name: "The Perfect Week",
    description: "Finish all 7 days of a training week.",
    icon: "crown",
    metric: "weeklyConsistency",
    threshold: 7,
    divine: true,
  },
];
