import { dateKey, lastNDays, weekKeys } from "./date";
import { levelProgress, rankDetails } from "./scoring";
import type { ActivityEntry, AppState, BasicDrill, Completion, Exercise, MemberSeed, MemberStats, Session } from "./types";

export function completionKey(memberId: string, date: string, sessionId: string, exerciseId: string): string {
  return `${memberId}|${date}|${sessionId}|${exerciseId}`;
}

export function getConsistencyStreak(days: string[], reference: Date = new Date()): number {
  const set = new Set(days);
  let cursor = new Date(reference);
  if (!set.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 3650) break;
  }
  return streak;
}

export function getMemberStats(state: AppState, memberId: string): MemberStats {
  const member = state.members.find((item) => item.id === memberId) ?? state.members[0];
  const localLog = state.log.filter((entry) => entry.memberId === member.id && !entry.seed);
  const localXp = localLog.reduce((sum, entry) => sum + entry.xp, 0);
  const localSeconds = localLog.reduce((sum, entry) => sum + entry.seconds, 0);
  const totalXp = member.baseXp + localXp;
  const totalSeconds = member.baseSeconds + localSeconds;

  const thisWeek = weekKeys();
  const weeklyLocal = localLog.filter((entry) => thisWeek.includes(dateKey(new Date(entry.at))));
  const weeklyXp = member.baseWeeklyXp + weeklyLocal.reduce((sum, entry) => sum + entry.xp, 0);

  const completedDays = Array.from(new Set(state.completedDays[member.id] ?? [])).sort();
  const completedSet = new Set(completedDays);
  const weeklyDays = thisWeek.map((day) => completedSet.has(day));
  const weekCount = weeklyDays.filter(Boolean).length;
  const monthWindow = lastNDays(30);
  const monthCount = completedDays.filter((day) => monthWindow.includes(day)).length;

  const localMissionRefs = new Set(
    localLog
      .filter((entry) => entry.kind === "mission")
      .map((entry) => entry.ref ?? `${dateKey(new Date(entry.at))}:${entry.title}`),
  );
  const localBasics = localLog.filter((entry) => entry.kind === "basics").length;

  const level = levelProgress(totalXp);
  const rank = rankDetails(totalXp);

  return {
    member,
    totalXp,
    weeklyXp,
    totalSeconds,
    completedMissions: member.baseMissions + localMissionRefs.size,
    level: level.level,
    rank: rank.rank,
    nextRank: rank.nextRank,
    rankProgress: rank.rankProgress,
    rankFloor: rank.rankFloor,
    nextRankXp: rank.nextRankXp,
    levelProgress: level.progress,
    xpToNextLevel: level.xpToNextLevel,
    totalLocalXp: localXp,
    streak: getConsistencyStreak(completedDays),
    weeklyDays,
    weeklyConsistency: Math.round((weekCount / 7) * 100),
    monthlyConsistency: Math.round((monthCount / 30) * 100),
    localMissions: localMissionRefs.size,
    localExerciseSeconds: localSeconds,
    localBasics,
  };
}

export function allStats(state: AppState): MemberStats[] {
  return state.members.map((member) => getMemberStats(state, member.id));
}

export function leaderboard(state: AppState): MemberStats[] {
  return allStats(state).sort((a, b) => b.weeklyXp - a.weeklyXp);
}

export function todayActivity(state: AppState, memberId: string): ActivityEntry[] {
  const key = dateKey();
  return state.log.filter((entry) => entry.memberId === memberId && dateKey(new Date(entry.at)) === key);
}

export function recentActivity(state: AppState, memberId?: string, limit = 8): ActivityEntry[] {
  return state.log
    .filter((entry) => !memberId || entry.memberId === memberId)
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export function isDone(
  state: AppState,
  memberId: string,
  date: string,
  sessionId: string,
  exerciseId: string,
): boolean {
  return Boolean(state.completions[completionKey(memberId, date, sessionId, exerciseId)]);
}

export function completionFor(
  state: AppState,
  memberId: string,
  date: string,
  sessionId: string,
  exerciseId: string,
): Completion | null {
  return state.completions[completionKey(memberId, date, sessionId, exerciseId)] ?? null;
}

export function sessionProgress(
  state: AppState,
  memberId: string,
  session: Session | undefined,
  date: string = dateKey(),
): { completed: number; total: number; percent: number; exercises: Exercise[] } {
  if (!session) return { completed: 0, total: 0, percent: 0, exercises: [] };
  const completed = session.exercises.filter((item) => isDone(state, memberId, date, session.id, item.id)).length;
  return {
    completed,
    total: session.exercises.length,
    percent: session.exercises.length ? Math.round((completed / session.exercises.length) * 100) : 0,
    exercises: session.exercises,
  };
}

export function basicsCompletion(
  state: AppState,
  memberId: string,
  drills: BasicDrill[],
  date: string = dateKey(),
): { completed: number; total: number; percent: number } {
  const completed = drills.filter((drill) => isDone(state, memberId, date, "daily-basics", drill.id)).length;
  return { completed, total: drills.length, percent: drills.length ? Math.round((completed / drills.length) * 100) : 0 };
}

export function sessionPlanSeconds(session: Session): number {
  return session.exercises.reduce((sum, item) => {
    if (item.durationSec) return sum + item.durationSec * item.sets;
    if (item.reps) return sum + Math.max(20, item.reps * 3.5) * item.sets;
    return sum + 45 * item.sets;
  }, 0);
}

export function basicAsExercise(drill: BasicDrill): Exercise {
  return {
    id: drill.id,
    name: drill.title,
    sets: drill.sets,
    durationSec: Math.max(30, Math.round((drill.minutes * 60) / Math.max(1, drill.sets))),
    restSec: drill.restSec,
    cues: drill.subtitle,
    source: "protocol",
  };
}

export function memberById(state: AppState, id: string): MemberSeed {
  return state.members.find((member) => member.id === id) ?? state.members[0];
}

export function missionBonusFor(state: AppState, memberId: string, date: string, sessionId: string): ActivityEntry | undefined {
  return state.log.find(
    (entry) => entry.memberId === memberId && entry.ref === `mission:${memberId}|${date}|${sessionId}`,
  );
}
