import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dateKey, sessionForDate } from "./date";
import { BASIC_XP, exerciseSeconds, exerciseXp, missionBonus } from "./scoring";
import { createInitialState, SCHEDULE, DAILY_BASICS } from "./seed";
import { completionKey, getMemberStats, isDone, missionBonusFor, sessionProgress } from "./selectors";
import { exportState, localHunterRepository } from "./storage";
import type {
  AppState,
  BasicDrill,
  CompletionSource,
  Exercise,
  MemberStats,
  Session,
  WorkoutSummary,
} from "./types";

interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone: "gold" | "success" | "warning";
}

interface TogglePayload {
  sessionId: string;
  exercise: Exercise;
  source: CompletionSource;
  xp?: number;
  seconds?: number;
  date?: string;
}

interface HunterContextValue {
  state: AppState;
  activeMember: AppState["members"][number];
  stats: MemberStats;
  squadStats: MemberStats[];
  todaySession: Session | undefined;
  todayDate: string;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  setActiveMember: (id: string) => void;
  renameActiveMember: (name: string) => void;
  toggleSessionExercise: (session: Session, exercise: Exercise) => void;
  toggleBasic: (drill: BasicDrill) => void;
  toggleSupplementary: (exercise: Exercise) => void;
  addSupplementary: (input: { name: string; sets: number; reps: number; restSec: number }) => void;
  removeSupplementary: (id: string) => void;
  updateSession: (sessionId: string, patch: Partial<Pick<Session, "title" | "focus" | "minutes" | "note">>) => void;
  updateSessionExercise: (sessionId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  addSessionExercise: (sessionId: string) => void;
  removeSessionExercise: (sessionId: string, exerciseId: string) => void;
  restoreSchedule: () => void;
  setPlannedMinutes: (minutes: number) => void;
  setCameraConsent: (value: boolean) => void;
  beginMission: (sessionId: string) => void;
  ensureWorkout: (sessionId: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  finishWorkout: () => WorkoutSummary | null;
  clearSummary: () => void;
  resetAll: () => void;
  downloadRecord: () => void;
  notify: (title: string, detail?: string, tone?: ToastMessage["tone"]) => void;
}

const HunterContext = createContext<HunterContextValue | null>(null);

const createId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)}`;

function uniqueDates(dates: string[]): string[] {
  return Array.from(new Set(dates)).sort();
}

function todayIso(): string {
  return new Date().toISOString();
}

function addExerciseEntry(
  state: AppState,
  memberId: string,
  payload: TogglePayload,
  date: string,
  xp: number,
  seconds: number,
): { state: AppState; title: string } {
  const key = completionKey(memberId, date, payload.sessionId, payload.exercise.id);
  if (state.completions[key]) return { state, title: payload.exercise.name };
  const session = state.schedule.find((item) => item.id === payload.sessionId);
  const at = todayIso();
  const completion = {
    memberId,
    date,
    sessionId: payload.sessionId,
    exerciseId: payload.exercise.id,
    exerciseName: payload.exercise.name,
    source: payload.source,
    xp,
    seconds,
  };
  const kind = payload.source === "basics" ? "basics" : payload.source === "recovery" ? "recovery" : "exercise";
  let next: AppState = {
    ...state,
    completions: { ...state.completions, [key]: completion },
    log: [
      ...state.log,
      {
        id: createId("log"),
        memberId,
        kind,
        title: payload.exercise.name,
        detail: session ? session.title : payload.source === "basics" ? "Permanent daily foundations" : "Supplementary exercise",
        xp,
        seconds,
        at,
        ref: `ex:${key}`,
      },
    ],
  };

  if (payload.source === "session" && session) {
    const allDone = session.exercises.every((item) =>
      Boolean(next.completions[completionKey(memberId, date, session.id, item.id)]),
    );
    if (allDone && !missionBonusFor(next, memberId, date, session.id)) {
      const bonus = missionBonus(next.plannedMinutes);
      next = {
        ...next,
        completedDays: {
          ...next.completedDays,
          [memberId]: uniqueDates([...(next.completedDays[memberId] ?? []), date]),
        },
        log: [
          ...next.log,
          {
            id: createId("log"),
            memberId,
            kind: "mission",
            title: `${session.title} complete`,
            detail: `${session.exercises.length} exercises · ${next.plannedMinutes} min protocol`,
            xp: bonus,
            seconds: 0,
            at,
            ref: `mission:${memberId}|${date}|${session.id}`,
          },
        ],
      };
    }
  }
  return { state: next, title: payload.exercise.name };
}

function removeExerciseEntry(state: AppState, memberId: string, payload: TogglePayload, date: string): AppState {
  const key = completionKey(memberId, date, payload.sessionId, payload.exercise.id);
  if (!state.completions[key]) return state;

  const completions = { ...state.completions };
  delete completions[key];
  let log = state.log.filter((entry) => entry.ref !== `ex:${key}`);
  let completedDays = state.completedDays;

  if (payload.source === "session") {
    const session = state.schedule.find((item) => item.id === payload.sessionId);
    if (session) {
      const allDone = session.exercises.every((item) =>
        Boolean(completions[completionKey(memberId, date, session.id, item.id)]),
      );
      if (!allDone) {
        const bonusRef = `mission:${memberId}|${date}|${session.id}`;
        log = log.filter((entry) => entry.ref !== bonusRef);
        const otherMissions = log.some(
          (entry) =>
            entry.memberId === memberId &&
            entry.kind === "mission" &&
            !entry.seed &&
            dateKey(new Date(entry.at)) === date,
        );
        if (!otherMissions) {
          completedDays = {
            ...completedDays,
            [memberId]: (completedDays[memberId] ?? []).filter((day) => day !== date),
          };
        }
      }
    }
  }

  return { ...state, completions, log, completedDays };
}

export function HunterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => localHunterRepository.load());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    localHunterRepository.save(state);
  }, [state]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(
    (title: string, detail?: string, tone: ToastMessage["tone"] = "gold") => {
      const id = createId("toast");
      setToasts((current) => [...current.slice(-3), { id, title, detail, tone }]);
      timers.current[id] = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        delete timers.current[id];
      }, 4200);
    },
    [],
  );

  const activeMember = useMemo(
    () => state.members.find((member) => member.id === state.activeMemberId) ?? state.members[0],
    [state.members, state.activeMemberId],
  );
  const stats = useMemo(() => getMemberStats(state, state.activeMemberId), [state, state.activeMemberId]);
  const squadStats = useMemo(
    () => state.members.map((member) => getMemberStats(state, member.id)),
    [state],
  );
  const todaySession = useMemo(() => sessionForDate(state.schedule), [state.schedule]);

  const toggleByPayload = useCallback(
    (payload: TogglePayload) => {
      const date = payload.date ?? dateKey();
      const memberId = state.activeMemberId;
      const done = isDone(state, memberId, date, payload.sessionId, payload.exercise.id);
      const xp = payload.xp ?? exerciseXp(payload.exercise);
      const seconds = payload.seconds ?? exerciseSeconds(payload.exercise);

      setState((current) =>
        done ? removeExerciseEntry(current, memberId, payload, date) : addExerciseEntry(current, memberId, payload, date, xp, seconds).state,
      );

      if (done) {
        notify(`${payload.exercise.name} unchecked`, "The associated local XP was reversed.", "warning");
      } else {
        notify(`+${xp} XP · ${payload.exercise.name}`, `${seconds}s of exercise recorded to ${activeMember.name}.`, "success");
      }
    },
    [activeMember.name, notify, state],
  );

  const setActiveMember = useCallback(
    (id: string) => {
      setState((current) => ({ ...current, activeMemberId: id }));
      const member = state.members.find((item) => item.id === id);
      notify("Active hunter attuned", member ? `Now viewing ${member.name}'s dossier.` : "Member switched.");
    },
    [notify, state.members],
  );

  const renameActiveMember = useCallback(
    (name: string) => {
      const clean = name.trim().slice(0, 28);
      if (!clean) return;
      const monogram = clean
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setState((current) => ({
        ...current,
        members: current.members.map((member) =>
          member.id === current.activeMemberId ? { ...member, name: clean, monogram } : member,
        ),
      }));
      notify("Hunter name updated", "Your local dossier has been amended.");
    },
    [notify],
  );

  const toggleSessionExercise = useCallback(
    (session: Session, exercise: Exercise) => {
      toggleByPayload({ sessionId: session.id, exercise, source: "session" });
    },
    [toggleByPayload],
  );

  const toggleBasic = useCallback(
    (drill: BasicDrill) => {
      toggleByPayload({
        sessionId: "daily-basics",
        exercise: {
          id: drill.id,
          name: drill.title,
          sets: drill.sets,
          durationSec: Math.max(30, Math.round((drill.minutes * 60) / Math.max(1, drill.sets))),
          reps: undefined,
          restSec: drill.restSec,
          cues: drill.subtitle,
        },
        source: "basics",
        xp: BASIC_XP,
        seconds: drill.minutes * 60,
      });
    },
    [toggleByPayload],
  );

  const toggleSupplementary = useCallback(
    (exercise: Exercise) => {
      toggleByPayload({ sessionId: "supplementary", exercise, source: "supplementary" });
    },
    [toggleByPayload],
  );

  const addSupplementary = useCallback(
    ({ name, sets, reps, restSec }: { name: string; sets: number; reps: number; restSec: number }) => {
      const clean = name.trim();
      if (!clean) {
        notify("Name required", "Give the optional exercise a name before adding it.", "warning");
        return;
      }
      setState((current) => ({
        ...current,
        supplementary: [
          ...current.supplementary,
          {
            id: createId("supp"),
            name: clean.slice(0, 48),
            sets: Math.max(1, Math.min(20, sets || 1)),
            reps: Math.max(1, Math.min(100, reps || 1)),
            restSec: Math.max(0, Math.min(600, restSec || 0)),
            source: "custom",
            cues: "Optional supplementary work. It does not affect today's mission completion.",
          },
        ],
      }));
      notify("Supplementary exercise added", `${clean} is now optional training for today.`, "gold");
    },
    [notify],
  );

  const removeSupplementary = useCallback(
    (id: string) => {
      setState((current) => {
        const completionsEntries = Object.entries(current.completions).filter(
          ([, completion]) => !(completion.sessionId === "supplementary" && completion.exerciseId === id),
        );
        return {
          ...current,
          supplementary: current.supplementary.filter((item) => item.id !== id),
          completions: Object.fromEntries(completionsEntries),
          log: current.log.filter((entry) => !entry.ref?.endsWith(`|supplementary|${id}`)),
        };
      });
      notify("Supplementary exercise removed", "Any associated local XP was reversed.", "warning");
    },
    [notify],
  );

  const updateSession = useCallback(
    (sessionId: string, patch: Partial<Pick<Session, "title" | "focus" | "minutes" | "note">>) => {
      setState((current) => ({
        ...current,
        schedule: current.schedule.map((session) => (session.id === sessionId ? { ...session, ...patch } : session)),
      }));
    },
    [],
  );

  const updateSessionExercise = useCallback((sessionId: string, exerciseId: string, patch: Partial<Exercise>) => {
    setState((current) => ({
      ...current,
      schedule: current.schedule.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              exercises: session.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      ...patch,
                      sets: patch.sets !== undefined ? Math.max(1, Math.min(20, Number(patch.sets) || 1)) : exercise.sets,
                      reps:
                        "reps" in patch
                          ? patch.reps === undefined
                            ? undefined
                            : Math.max(1, Math.min(200, Number(patch.reps) || 1))
                          : exercise.reps,
                      restSec:
                        patch.restSec !== undefined
                          ? Math.max(0, Math.min(600, Number(patch.restSec) || 0))
                          : exercise.restSec,
                      durationSec:
                        "durationSec" in patch
                          ? patch.durationSec === undefined
                            ? undefined
                            : Math.max(5, Math.min(3600, Number(patch.durationSec) || 5))
                          : exercise.durationSec,
                    }
                  : exercise,
              ),
            }
          : session,
      ),
    }));
  }, []);

  const addSessionExercise = useCallback((sessionId: string) => {
    setState((current) => ({
      ...current,
      schedule: current.schedule.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              exercises: [
                ...session.exercises,
                {
                  id: createId("ex"),
                  name: "New protocol movement",
                  sets: 3,
                  reps: 10,
                  restSec: 60,
                  cues: "Add your own coaching cue for this movement.",
                  source: "protocol",
                },
              ],
            }
          : session,
      ),
    }));
    notify("Movement added", "Edit its name, volume and rest in the schedule.", "gold");
  }, [notify]);

  const removeSessionExercise = useCallback((sessionId: string, exerciseId: string) => {
    setState((current) => {
      const target = current.schedule.find((session) => session.id === sessionId);
      if (!target?.exercises.some((exercise) => exercise.id === exerciseId)) return current;

      const removedEntries = Object.entries(current.completions).filter(
        ([, completion]) => completion.sessionId === sessionId && completion.exerciseId === exerciseId,
      );
      const removedKeys = new Set(removedEntries.map(([key]) => key));
      const affected = new Set(
        removedEntries.map(([, completion]) => `${completion.memberId}|${completion.date}`),
      );
      const schedule = current.schedule.map((session) =>
        session.id === sessionId
          ? { ...session, exercises: session.exercises.filter((exercise) => exercise.id !== exerciseId) }
          : session,
      );
      const remainingSession = schedule.find((session) => session.id === sessionId);
      const completions = Object.fromEntries(
        Object.entries(current.completions).filter(([key]) => !removedKeys.has(key)),
      );
      let log = current.log.filter((entry) => {
        if (!entry.ref?.startsWith("ex:")) return true;
        const key = entry.ref.slice(3);
        return !removedKeys.has(key) && !key.endsWith(`|${sessionId}|${exerciseId}`);
      });
      let completedDays = current.completedDays;

      // Keep a historical mission bonus only when every movement still in the
      // edited protocol was completed on that member/date.
      for (const item of affected) {
        const separator = item.indexOf("|");
        const memberId = item.slice(0, separator);
        const date = item.slice(separator + 1);
        const stillComplete = Boolean(
          remainingSession?.exercises.length &&
          remainingSession.exercises.every((exercise) =>
            Boolean(completions[completionKey(memberId, date, sessionId, exercise.id)]),
          ),
        );
        if (!stillComplete) {
          const bonusRef = `mission:${memberId}|${date}|${sessionId}`;
          log = log.filter((entry) => entry.ref !== bonusRef);
          const anotherMissionThatDay = log.some(
            (entry) =>
              entry.memberId === memberId &&
              entry.kind === "mission" &&
              !entry.seed &&
              entry.ref?.startsWith(`mission:${memberId}|${date}|`),
          );
          if (!anotherMissionThatDay) {
            completedDays = {
              ...completedDays,
              [memberId]: (completedDays[memberId] ?? []).filter((day) => day !== date),
            };
          }
        }
      }

      return { ...current, schedule, completions, log, completedDays };
    });
    notify("Movement removed", "Its completion record and associated XP were reconciled. Earlier valid mission history was preserved.", "warning");
  }, [notify]);

  const restoreSchedule = useCallback(() => {
    const today = dateKey();
    setState((current) => ({
      ...current,
      schedule: SCHEDULE.map((session) => ({
        ...session,
        exercises: session.exercises.map((item) => ({ ...item })),
      })),
      dailyBasics: DAILY_BASICS.map((drill) => ({ ...drill })),
      supplementary: [],
      completions: Object.fromEntries(
        Object.entries(current.completions).filter(
          ([, completion]) => !(completion.memberId === current.activeMemberId && completion.date === today),
        ),
      ),
      completedDays: {
        ...current.completedDays,
        [current.activeMemberId]: (current.completedDays[current.activeMemberId] ?? []).filter((day) => day !== today),
      },
      log: current.log.filter(
        (entry) =>
          entry.seed ||
          entry.memberId !== current.activeMemberId ||
          dateKey(new Date(entry.at)) !== today,
      ),
    }));
    notify("Default protocol restored", "Today's check-offs for the current hunter were cleared. Prior days remain intact.", "gold");
  }, [notify]);

  const setPlannedMinutes = useCallback(
    (minutes: number) => {
      setState((current) => ({ ...current, plannedMinutes: [10, 15, 20, 30].includes(minutes) ? minutes : 20 }));
      notify("Session length set", `${minutes} minutes selected for today's protocol.`);
    },
    [notify],
  );

  const setCameraConsent = useCallback(
    (value: boolean) => {
      setState((current) => ({ ...current, cameraConsent: value }));
      notify(
        value ? "Private proof preference saved" : "Private proof preference withdrawn",
        value
          ? "Consent is stored locally. No camera is opened and nothing is uploaded in this build."
          : "The camera will remain untouched.",
        value ? "gold" : "warning",
      );
    },
    [notify],
  );

  const beginMission = useCallback((sessionId: string) => {
    setState((current) => ({
      ...current,
      lastSummary: null,
      activeWorkout: { sessionId, status: "idle", accumulatedMs: 0, resumedAt: null },
    }));
  }, []);

  const ensureWorkout = useCallback((sessionId: string) => {
    setState((current) => {
      if (current.activeWorkout.sessionId === sessionId) return current;
      return {
        ...current,
        lastSummary: null,
        activeWorkout: { sessionId, status: "idle", accumulatedMs: 0, resumedAt: null },
      };
    });
  }, []);

  const startTimer = useCallback(() => {
    setState((current) => {
      if (!current.activeWorkout.sessionId) return current;
      if (current.activeWorkout.status === "running") return current;
      const isFresh = current.activeWorkout.status === "idle";
      return {
        ...current,
        activeWorkout: {
          ...current.activeWorkout,
          status: "running",
          accumulatedMs: isFresh ? 0 : current.activeWorkout.accumulatedMs,
          resumedAt: Date.now(),
        },
      };
    });
    notify("Working timer started", "No XP is granted by the timer alone. Complete exercises to bank progress.");
  }, [notify]);

  const pauseTimer = useCallback(() => {
    setState((current) => {
      if (current.activeWorkout.status !== "running") return current;
      const gained = current.activeWorkout.resumedAt ? Date.now() - current.activeWorkout.resumedAt : 0;
      return {
        ...current,
        activeWorkout: {
          ...current.activeWorkout,
          status: "paused",
          accumulatedMs: current.activeWorkout.accumulatedMs + gained,
          resumedAt: null,
        },
      };
    });
    notify("Timer paused", "Your working time has been preserved.");
  }, [notify]);

  const resumeTimer = useCallback(() => {
    setState((current) => {
      if (current.activeWorkout.status !== "paused") return current;
      return {
        ...current,
        activeWorkout: { ...current.activeWorkout, status: "running", resumedAt: Date.now() },
      };
    });
    notify("Timer resumed", "Return to the protocol when ready.");
  }, [notify]);

  const resetTimer = useCallback(() => {
    setState((current) => ({
      ...current,
      activeWorkout: { ...current.activeWorkout, status: "idle", accumulatedMs: 0, resumedAt: null },
    }));
    notify("Timer reset", "Exercise check-offs are untouched.", "warning");
  }, [notify]);

  const finishWorkout = useCallback((): WorkoutSummary | null => {
    const sessionId = state.activeWorkout.sessionId ?? state.lastSummary?.sessionId;
    const session = state.schedule.find((item) => item.id === sessionId);
    if (!session) return null;
    const progress = sessionProgress(state, state.activeMemberId, session);
    const additionalSeconds = state.activeWorkout.status === "running" && state.activeWorkout.resumedAt ? Date.now() - state.activeWorkout.resumedAt : 0;
    const elapsedMs = state.activeWorkout.accumulatedMs + additionalSeconds;
    const exerciseLogs = state.log.filter(
      (entry) =>
        entry.memberId === state.activeMemberId &&
        !entry.seed &&
        entry.kind !== "mission" &&
        session.exercises.some((exercise) => entry.ref === `ex:${completionKey(state.activeMemberId, dateKey(), session.id, exercise.id)}`),
    );
    const bonus = missionBonusFor(state, state.activeMemberId, dateKey(), session.id);
    const summaryXp = exerciseLogs.reduce((sum, entry) => sum + entry.xp, 0) + (bonus?.xp ?? 0);
    const summarySeconds = exerciseLogs.reduce((sum, entry) => sum + entry.seconds, 0);
    const summary: WorkoutSummary = {
      id: createId("summary"),
      sessionId: session.id,
      sessionTitle: session.title,
      date: dateKey(),
      memberId: state.activeMemberId,
      completed: progress.completed,
      total: progress.total,
      seconds: summarySeconds,
      xp: summaryXp,
      missionComplete: progress.total > 0 && progress.completed === progress.total,
      finishedAt: todayIso(),
    };
    setState((current) => ({
      ...current,
      activeWorkout: { sessionId: null, status: "idle", accumulatedMs: elapsedMs, resumedAt: null },
      lastSummary: summary,
    }));
    return summary;
  }, [state]);

  const clearSummary = useCallback(() => {
    setState((current) => ({ ...current, lastSummary: null }));
  }, []);

  const resetAll = useCallback(() => {
    localHunterRepository.clear();
    setState(createInitialState());
    notify("Local record reset", "The seeded demo protocol has been restored on this device.", "warning");
  }, [notify]);

  const downloadRecord = useCallback(() => {
    exportState(state);
    notify("Record exported", "A JSON copy of this device's hunter state has been downloaded.");
  }, [notify, state]);

  const value = useMemo<HunterContextValue>(
    () => ({
      state,
      activeMember,
      stats,
      squadStats,
      todaySession,
      todayDate: dateKey(),
      toasts,
      dismissToast,
      setActiveMember,
      renameActiveMember,
      toggleSessionExercise,
      toggleBasic,
      toggleSupplementary,
      addSupplementary,
      removeSupplementary,
      updateSession,
      updateSessionExercise,
      addSessionExercise,
      removeSessionExercise,
      restoreSchedule,
      setPlannedMinutes,
      setCameraConsent,
      beginMission,
      ensureWorkout,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      finishWorkout,
      clearSummary,
      resetAll,
      downloadRecord,
      notify,
    }),
    [
      state,
      activeMember,
      stats,
      squadStats,
      todaySession,
      toasts,
      dismissToast,
      setActiveMember,
      renameActiveMember,
      toggleSessionExercise,
      toggleBasic,
      toggleSupplementary,
      addSupplementary,
      removeSupplementary,
      updateSession,
      updateSessionExercise,
      addSessionExercise,
      removeSessionExercise,
      restoreSchedule,
      setPlannedMinutes,
      setCameraConsent,
      beginMission,
      ensureWorkout,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      finishWorkout,
      clearSummary,
      resetAll,
      downloadRecord,
      notify,
    ],
  );

  return <HunterContext.Provider value={value}>{children}</HunterContext.Provider>;
}

export function useHunter(): HunterContextValue {
  const context = useContext(HunterContext);
  if (!context) throw new Error("useHunter must be used inside HunterProvider");
  return context;
}
