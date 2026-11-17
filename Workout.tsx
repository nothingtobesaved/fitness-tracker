import { useEffect, useMemo, useState } from "react";
import { formatClockFromMs, formatDuration, formatNumber } from "@/lib/date";
import { navigate } from "@/lib/router";
import { exerciseDosage, exerciseRest, exerciseXp, missionBonus } from "@/lib/scoring";
import { completionFor, isDone, missionBonusFor, sessionProgress } from "@/lib/selectors";
import { useHunter } from "@/lib/store";
import type { WorkoutSummary } from "@/lib/types";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Emblem,
  ExerciseCheckbox,
  Eyebrow,
  GreekKey,
  Icon,
  MemberAvatar,
  Modal,
  Pill,
  ProgressBar,
  RingProgress,
  SectionHeader,
  Toggle,
} from "@/components/ui";
import { LocalDataBadge } from "@/components/widgets";

export function Workout({ sessionId }: { sessionId?: string }) {
  const {
    state,
    activeMember,
    stats,
    todaySession,
    todayDate,
    beginMission,
    ensureWorkout,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    finishWorkout,
    clearSummary,
    setPlannedMinutes,
    setCameraConsent,
    toggleSessionExercise,
    notify,
  } = useHunter();

  const session = state.schedule.find((item) => item.id === sessionId) ?? todaySession;
  const [now, setNow] = useState(() => Date.now());
  const [finishOpen, setFinishOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restLabel, setRestLabel] = useState("");

  const workout = state.activeWorkout;
  const progress = sessionProgress(state, activeMember.id, session, todayDate);
  const summaryForSession =
    state.lastSummary && (!session || state.lastSummary.sessionId === session.id) ? state.lastSummary : null;

  const firstIncomplete = useMemo(() => {
    if (!session) return 0;
    const index = session.exercises.findIndex(
      (exercise) => !isDone(state, activeMember.id, todayDate, session.id, exercise.id),
    );
    return index === -1 ? 0 : index;
  }, [session, state, activeMember.id, todayDate]);

  const [exerciseIndex, setExerciseIndex] = useState(firstIncomplete);

  useEffect(() => {
    if (!session) return;
    if (state.lastSummary?.sessionId === session.id) return;
    ensureWorkout(session.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    setExerciseIndex(firstIncomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const isTimerLive = workout.status === "running" || Boolean(restEndsAt);
  useEffect(() => {
    if (!isTimerLive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [isTimerLive]);

  useEffect(() => {
    if (restEndsAt && now >= restEndsAt) setRestEndsAt(null);
  }, [now, restEndsAt]);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Emblem size={56} className="mx-auto text-gold/70" />
        <h1 className="mt-4 font-display text-[25px] text-parchment">No chamber assigned</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Select a protocol from mission command before entering the workout chamber.
        </p>
        <Button variant="primary" icon="target" className="mt-5" onClick={() => navigate("missions")}>
          Open mission command
        </Button>
      </div>
    );
  }

  const total = session.exercises.length;
  const current = session.exercises[Math.min(exerciseIndex, total - 1)];
  const currentDone = current
    ? Boolean(completionFor(state, activeMember.id, todayDate, session.id, current.id))
    : false;
  const completed = progress.completed;
  const allDone = total > 0 && completed === total;
  const bonusRow = missionBonusFor(state, activeMember.id, todayDate, session.id);
  const sessionXp =
    session.exercises.reduce(
      (sum, exercise) =>
        sum +
        (isDone(state, activeMember.id, todayDate, session.id, exercise.id) ? exerciseXp(exercise) : 0),
      0,
    ) + (allDone ? bonusRow?.xp ?? missionBonus(state.plannedMinutes) : 0);
  const sessionSeconds = session.exercises.reduce(
    (sum, exercise) =>
      sum +
      (isDone(state, activeMember.id, todayDate, session.id, exercise.id)
        ? completionFor(state, activeMember.id, todayDate, session.id, exercise.id)?.seconds ?? 0
        : 0),
    0,
  );

  const targetMs = state.plannedMinutes * 60_000;
  const elapsedMs =
    workout.accumulatedMs + (workout.status === "running" && workout.resumedAt ? now - workout.resumedAt : 0);
  const remainingMs = targetMs - elapsedMs;
  const timePercent = Math.min(100, Math.round((elapsedMs / Math.max(1, targetMs)) * 100));
  const restRemaining = restEndsAt ? Math.max(0, restEndsAt - now) : 0;
  const isRunning = workout.status === "running";
  const isPaused = workout.status === "paused";
  const isIdle = workout.status === "idle";
  const memberName = activeMember.name;

  const toggleComplete = () => {
    if (!current || isIdle) {
      if (isIdle) notify("Start the timer first", "A chamber session begins with the working timer. Exercise XP is only recorded on completion.", "warning");
      return;
    }
    toggleSessionExercise(session, current);
    if (!currentDone) {
      const restSeconds = Math.min(300, Math.max(0, current.restSec));
      if (restSeconds > 0) {
        setRestTotal(restSeconds * 1000);
        setRestEndsAt(Date.now() + restSeconds * 1000);
        setRestLabel(current.restSec >= 60 ? exerciseRest(current) : `${current.restSec}s rest`);
        setNow(Date.now());
      }
      if (exerciseIndex < total - 1) {
        setExerciseIndex((value) => Math.min(total - 1, value + 1));
      }
    } else {
      setRestEndsAt(null);
    }
  };

  const runFinish = () => {
    setFinishOpen(false);
    setRestEndsAt(null);
    finishWorkout();
  };

  if (summaryForSession) {
    return (
      <WorkoutSummaryView
        summary={summaryForSession}
        streak={stats.streak}
        onClearAndReturn={(path) => {
          clearSummary();
          beginMission(session.id);
          navigate(path);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-fade flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("dashboard")}
            className="mb-1.5 inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-muted transition-colors hover:text-gold"
          >
            <Icon name="arrowLeft" size={12} /> Back to chamber
          </button>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            <Eyebrow className="text-gold/80">Live protocol</Eyebrow>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-muted/50 sm:inline">/ working timer</span>
          </div>
          <h1 className="mt-1.5 font-display text-[24px] font-medium leading-tight text-[#f0ebdf] sm:text-[28px]">
            Active Workout Chamber
          </h1>
          <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-muted">
            Log each movement as it is finished. The timer is a tool, not a trophy — no XP is granted for time alone.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalDataBadge />
          <Pill tone={isRunning ? "orange" : isPaused ? "gold" : "dark"} dot>
            {isRunning ? "Working" : isPaused ? "Paused" : "Staged"}
          </Pill>
          <Button variant="danger" size="sm" icon="check" onClick={() => setFinishOpen(true)}>
            Finish workout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-3.5 xl:col-span-8">
          <Card className="hero-wash corner-brackets overflow-hidden border-gold/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-2.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border border-gold/25 bg-gold/[0.06] font-display text-[10px] text-gold">
                  {String(exerciseIndex + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-[8.5px] uppercase tracking-[0.15em] text-muted/70">
                    {session.type} protocol · {session.day}
                  </p>
                  <p className="truncate font-sans text-[9px] text-muted/55">
                    {memberName} · {todayDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="dark">{completed}/{total} logged</Pill>
                <Pill tone="gold">Session staged</Pill>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-col items-center text-center">
                <span className="font-sans text-[9px] uppercase tracking-[0.24em] text-orange/80">
                  {isIdle ? "Chamber awaiting start" : isPaused ? "Session paused" : "Exercise in progress"}
                </span>
                <h2 className="mt-1.5 max-w-xl font-display text-[24px] leading-tight text-[#f5edde] sm:text-[30px]">
                  {current?.name ?? "Protocol complete"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <Pill tone="dark">{current ? exerciseDosage(current) : "—"}</Pill>
                  <Pill tone="dark">{current ? exerciseRest(current) : "—"}</Pill>
                  <Pill tone="gold">+{current ? exerciseXp(current) : 0} XP</Pill>
                </div>

                <div className="relative mt-4">
                  <div className={cn("absolute inset-4 rounded-full blur-3xl transition-opacity", isRunning ? "bg-orange/15" : "bg-gold/[0.04]")} />
                  <RingProgress value={isIdle ? 0 : timePercent} size={206} stroke={5} tone={isRunning ? "orange" : "gold"} className="relative">
                    <span className="font-sans text-[8.5px] uppercase tracking-[0.24em] text-muted/85">
                      {isIdle ? "Working timer" : remainingMs >= 0 ? "Time remaining" : "Over target"}
                    </span>
                    <span className="tabular font-sans text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#f5efe3] sm:text-[47px]">
                      {isIdle ? formatClockFromMs(targetMs) : formatClockFromMs(Math.abs(remainingMs))}
                    </span>
                    <span className="mt-1.5 font-mono text-[9px] text-muted/70">
                      {isIdle ? `${state.plannedMinutes} min target` : `working ${formatClockFromMs(elapsedMs)}`}
                    </span>
                  </RingProgress>
                </div>

                <div className="mt-4 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                  <Button
                    variant={isRunning ? "secondary" : "primary"}
                    size="lg"
                    icon={isRunning ? "pause" : "play"}
                    onClick={() => {
                      if (isRunning) pauseTimer();
                      else if (isPaused) resumeTimer();
                      else startTimer();
                    }}
                    className="sm:flex-1"
                  >
                    {isRunning ? "Pause timer" : isPaused ? "Resume timer" : "Start workout"}
                  </Button>
                  <Button variant="secondary" size="lg" icon="refresh" onClick={resetTimer} title="Reset the working timer">
                    Reset
                  </Button>
                </div>
                <p className="mt-2 text-[9px] text-muted/60">
                  {isRunning
                    ? "Working time is being recorded. Pausing preserves every second."
                    : isPaused
                      ? "Timer paused. Your elapsed working time is preserved on this device."
                      : "Press start to open the working timer, then log exercises below."}
                </p>
              </div>

              {restRemaining > 0 ? (
                <div className="animate-rise mt-4 overflow-hidden rounded-[5px] border border-gold/25 bg-gold/[0.045]">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon name="timer" size={14} className="text-gold" />
                      <div>
                        <p className="font-sans text-[9px] uppercase tracking-[0.14em] text-gold/85">Rest interval</p>
                        <p className="text-[10px] text-muted/80">{restLabel} · shake out, breathe, reset.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular font-mono text-[16px] text-[#f2e3c8]">{formatClockFromMs(restRemaining)}</span>
                      <Button variant="ghost" size="sm" onClick={() => { setRestEndsAt((value) => (value ? value + 15000 : value)); setRestTotal((value) => value + 15000); }}>
                        +15s
                      </Button>
                      <Button variant="gold" size="sm" onClick={() => setRestEndsAt(null)}>
                        Skip rest
                      </Button>
                    </div>
                  </div>
                  <ProgressBar value={restTotal ? (restRemaining / restTotal) * 100 : 0} tone="gold" height="h-1" className="rounded-none" />
                </div>
              ) : null}

              <div className="mt-4 rounded-[4px] border border-line/80 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-sans text-[8.5px] uppercase tracking-[0.15em] text-gold/75">Form note</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted/90">{current?.cues ?? "Move with control and leave a rep in reserve."}</p>
                  </div>
                  <ExerciseCheckbox
                    checked={currentDone}
                    onChange={toggleComplete}
                    label={`${currentDone ? "Uncheck" : "Complete"} ${current?.name ?? "exercise"}`}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="md"
                  icon="chevronLeft"
                  disabled={exerciseIndex <= 0}
                  onClick={() => setExerciseIndex((value) => Math.max(0, value - 1))}
                >
                  Previous
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant={currentDone ? "gold" : "primary"}
                    size="md"
                    icon={currentDone ? "check" : "shield"}
                    disabled={isIdle}
                    onClick={toggleComplete}
                  >
                    {isIdle ? "Start timer to log" : currentDone ? "Completed · undo" : "Mark exercise complete"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    trailingIcon="chevronRight"
                    disabled={exerciseIndex >= total - 1}
                    onClick={() => setExerciseIndex((value) => Math.min(total - 1, value + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-line/70 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-sans text-[8.5px] uppercase tracking-[0.13em] text-muted/70">Overall progress</span>
                  <span className="font-mono text-[9px] text-gold/80">{completed}/{total}</span>
                </div>
                <span className="font-mono text-[9px] text-muted/65">{progress.percent}%</span>
              </div>
              <ProgressBar value={progress.percent} tone="orange" className="mt-1.5" />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {session.exercises.map((exercise, index) => {
                  const done = isDone(state, activeMember.id, todayDate, session.id, exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => setExerciseIndex(index)}
                      aria-label={`View exercise ${index + 1}: ${exercise.name}`}
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-[2px] border font-mono text-[8px] transition-colors",
                        index === exerciseIndex
                          ? "border-orange/55 bg-orange/15 text-orange"
                          : done
                            ? "border-teal/40 bg-teal/10 text-teal"
                            : "border-line bg-black/25 text-muted/60 hover:border-gold/30",
                      )}
                    >
                      {done ? <Icon name="check" size={9} /> : index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3.5 xl:col-span-4">
          {/* Camera preparation panel */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-2.5">
              <SectionHeader icon="camera" title="Timelapse proof" subtitle="Optional · explicit permission only" />
              <Pill tone="dark">Standby</Pill>
            </div>
            <div className="p-3.5">
              <div className="relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-[#3a3d46] bg-[radial-gradient(circle_at_50%_45%,rgba(214,183,127,0.055),transparent_65%)] px-4 text-center">
                <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-gold/30" />
                <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-gold/30" />
                <span className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-gold/30" />
                <span className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-gold/30" />
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold/75">
                  <Icon name="camera" size={18} />
                </span>
                <p className="mt-2 font-sans text-[9px] uppercase tracking-[0.16em] text-[#c2b28f]">Camera unavailable</p>
                <p className="mt-1 max-w-[28ch] text-[9px] leading-relaxed text-muted/75">
                  No recording or upload occurs in this build. Private proof will arrive with Supabase Storage.
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Explicit permission</span>
                <Pill tone={state.cameraConsent ? "teal" : "dark"} dot>
                  {state.cameraConsent ? "Preference saved" : "Not granted"}
                </Pill>
              </div>
              <div className="mt-2 rounded-[4px] border border-line bg-black/20 p-2.5">
                <Toggle
                  checked={state.cameraConsent}
                  onChange={setCameraConsent}
                  label="Allow private video proof in a future release"
                  description="Stores only this preference locally. It does not open the camera, record, or upload anything."
                />
              </div>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="mt-2 flex w-full items-center justify-between rounded-[3px] border border-line bg-black/20 px-2.5 py-1.5 font-sans text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:border-gold/30 hover:text-gold"
              >
                <span className="flex items-center gap-1.5">
                  <Icon name="lock" size={11} /> Privacy requirements
                </span>
                <Icon name="arrowUpRight" size={11} />
              </button>
            </div>
          </Card>

          {/* Queue */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
              <SectionHeader icon="sword" title="Session queue" subtitle={`${total} protocol movements`} />
              <span className="font-mono text-[9px] text-gold/80">{completed}/{total}</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {session.exercises.map((exercise, index) => {
                const done = isDone(state, activeMember.id, todayDate, session.id, exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => setExerciseIndex(index)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-2.5 rounded-[3px] border px-2.5 py-2 text-left transition-colors last:mb-0",
                      index === exerciseIndex
                        ? "border-orange/40 bg-orange/[0.07]"
                        : "border-transparent hover:border-line hover:bg-white/[0.02]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border font-mono text-[8px]",
                        done
                          ? "border-teal/45 bg-teal/10 text-teal"
                          : index === exerciseIndex
                            ? "border-orange/50 text-orange"
                            : "border-line text-muted/60",
                      )}
                    >
                      {done ? <Icon name="check" size={9} /> : String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10.5px] font-medium text-[#dcd7cc]">{exercise.name}</span>
                      <span className="block font-mono text-[8px] text-muted/65">
                        {exerciseDosage(exercise)} · {exerciseRest(exercise)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[8px] text-gold/50">+{exerciseXp(exercise)}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Session ledger */}
          <Card className="overflow-hidden">
            <div className="border-b border-line/70 px-4 py-2.5">
              <SectionHeader icon="shield" title="Session ledger" subtitle="Recorded locally, per exercise" />
            </div>
            <div className="space-y-2 p-3.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted/80">Exercise XP</span>
                <span className="font-mono text-gold/90">+{session.exercises.reduce((sum, exercise) => sum + (isDone(state, activeMember.id, todayDate, session.id, exercise.id) ? exerciseXp(exercise) : 0), 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted/80">Completion bonus</span>
                <span className={cn("font-mono", allDone ? "text-teal/90" : "text-muted/55")}>
                  {allDone ? `+${bonusRow?.xp ?? missionBonus(state.plannedMinutes)}` : "Locked"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted/80">Volume credited</span>
                <span className="font-mono text-[#d9d0bf]">{formatDuration(sessionSeconds)}</span>
              </div>
              <div className="h-px bg-line/70" />
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[#dcd6c8]">Chamber total</span>
                <span className="font-mono text-[11px] text-gold">+{sessionXp} XP</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-sans text-[8.5px] uppercase tracking-[0.1em] text-muted/65">Target</span>
                <select
                  className="field min-h-[30px] w-[92px] px-2 py-1 text-[10px]"
                  value={state.plannedMinutes}
                  onChange={(event) => setPlannedMinutes(Number(event.target.value))}
                  aria-label="Planned session duration"
                >
                  {[10, 15, 20, 30].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-[3px] border border-line bg-black/20 px-2 py-1.5">
                <MemberAvatar monogram={activeMember.monogram} size={24} active rank={stats.rank} />
                <div className="min-w-0">
                  <p className="truncate text-[9.5px] text-[#d8d2c6]">{activeMember.name}</p>
                  <p className="font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/60">Hunter on record</p>
                </div>
                {allDone ? <Pill tone="teal" className="ml-auto">Complete</Pill> : <Pill tone="dark" className="ml-auto">Open</Pill>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={completed === 0 ? "Finish with no exercises logged?" : "Close the workout chamber?"}
        eyebrow="Session summary"
        width="max-w-lg"
      >
        <div className="space-y-3">
          <p className="text-[12px] leading-relaxed text-muted">
            {completed === 0
              ? "No exercise has been completed, so this session will record 0 XP. The working timer alone never awards XP."
              : `You have completed ${completed} of ${total} protocol movements. Completed exercise records stay in your ledger, even if you end early.`}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <FinishStat label="Exercises" value={`${completed}/${total}`} />
            <FinishStat label="Volume" value={formatDuration(sessionSeconds)} />
            <FinishStat label="XP banked" value={`+${sessionXp}`} />
          </div>
          {!allDone ? (
            <div className="flex items-start gap-2 rounded-[4px] border border-gold/25 bg-gold/[0.05] px-3 py-2">
              <Icon name="info" size={12} className="mt-0.5 text-gold/80" />
              <p className="text-[10px] leading-relaxed text-muted/85">
                The mission completion bonus remains locked until all movements are checked. You can return and finish
                them later today.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-[4px] border border-teal/25 bg-teal/[0.05] px-3 py-2">
              <Icon name="check" size={12} className="mt-0.5 text-teal" />
              <p className="text-[10px] leading-relaxed text-muted/85">
                Mission complete. The completion bonus has been written to the local ledger and your streak has advanced.
              </p>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="sm" onClick={() => setFinishOpen(false)}>
              Keep training
            </Button>
            <Button variant="primary" size="sm" icon="check" onClick={runFinish}>
              Finish &amp; view summary
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Private proof, by permission" eyebrow="Camera & video policy" width="max-w-lg">
        <div className="space-y-3">
          {[
            ["Explicit opt-in", "No camera is accessed, recorded or uploaded without a clear, revocable action from the hunter."],
            ["Private by default", "When implemented, proof will live in a private Supabase Storage bucket. It will never be publicly listed."],
            ["Local demo is honest", "This build does not fake a recording state, preview feed, or successful upload. The consent switch only saves a preference in this browser."],
          ].map(([title, copy]) => (
            <div key={title} className="flex items-start gap-2.5 rounded-[4px] border border-line bg-black/20 p-3">
              <Icon name="lock" size={13} className="mt-0.5 text-gold/75" />
              <div>
                <p className="font-display text-[13px] text-[#e5decd]">{title}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{copy}</p>
              </div>
            </div>
          ))}
          <p className="text-[9.5px] leading-relaxed text-muted/60">
            The future bucket and table policies are documented in the repository README. Service-role keys must never
            appear in frontend code.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setPrivacyOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FinishStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-line bg-black/20 px-2 py-1.5 text-center">
      <p className="truncate font-mono text-[11px] text-[#e9dfcc]">{value}</p>
      <p className="mt-0.5 font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/65">{label}</p>
    </div>
  );
}

function WorkoutSummaryView({
  summary,
  streak,
  onClearAndReturn,
}: {
  summary: WorkoutSummary;
  streak: number;
  onClearAndReturn: (path: "dashboard" | "missions") => void;
}) {
  const percent = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-2 sm:py-6">
      <Card className="hero-wash corner-brackets animate-rise relative overflow-hidden border-gold/25">
        <GreekKey className="opacity-50" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.05]">
          <Emblem size={300} />
        </div>
        <div className="relative px-4 py-6 text-center sm:px-8 sm:py-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/35 bg-gold/[0.08] text-gold">
            <Icon name={summary.completed > 0 ? "trophy" : "timer"} size={21} />
          </span>
          <Eyebrow className="mt-3 text-gold/80">Chamber record sealed</Eyebrow>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight text-[#f5eedf] sm:text-[34px]">
            {summary.completed > 0 ? "The rite is recorded." : "No exercises recorded."}
          </h1>
          <p className="mx-auto mt-1.5 max-w-md text-[11.5px] leading-relaxed text-muted">
            {summary.completed > 0
              ? `${summary.sessionTitle} — your completed movements are written to the local ledger.`
              : "A timer alone is not a training record. Start the chamber, complete an exercise, and honest XP will follow."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryStat label="XP earned" value={`+${formatNumber(summary.xp)}`} tone="gold" />
            <SummaryStat label="Exercises" value={`${summary.completed}/${summary.total}`} />
            <SummaryStat label="Volume" value={formatDuration(summary.seconds)} />
            <SummaryStat label="Streak" value={`${streak}d`} />
          </div>

          <div className="mx-auto mt-4 max-w-md">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-sans text-[8.5px] uppercase tracking-[0.13em] text-muted/70">Protocol completion</span>
              <span className="font-mono text-[9px] text-gold/80">{percent}%</span>
            </div>
            <ProgressBar value={percent} tone={summary.missionComplete ? "teal" : "orange"} height="h-2" />
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              <Icon name={summary.missionComplete ? "check" : "info"} size={11} className={summary.missionComplete ? "text-teal" : "text-gold/70"} />
              <p className="text-[9px] text-muted/75">
                {summary.missionComplete
                  ? "Mission complete · completion bonus applied locally."
                  : "Mission bonus locked · finish every movement to claim it."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button variant="primary" icon="grid" onClick={() => onClearAndReturn("dashboard")}>
              Return to dashboard
            </Button>
            <Button variant="secondary" icon="target" onClick={() => onClearAndReturn("missions")}>
              Review protocol
            </Button>
          </div>
          <p className="mt-3 text-[8.5px] uppercase tracking-[0.12em] text-muted/50">
            Local demo record · not synchronized between hunters
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[5px] border border-line bg-panel/80 p-4">
          <Eyebrow>What advanced</Eyebrow>
          <ul className="mt-2 space-y-1.5 text-[10.5px] text-muted">
            <li className="flex items-start gap-2"><Icon name="check" size={11} className="mt-0.5 text-teal" /> Checked exercises were written with their own XP and volume.</li>
            <li className="flex items-start gap-2"><Icon name="check" size={11} className="mt-0.5 text-teal" /> Today's completed-day mark and streak were recalculated.</li>
            <li className="flex items-start gap-2"><Icon name="check" size={11} className="mt-0.5 text-teal" /> The completion bonus was applied once, when the final movement was checked.</li>
          </ul>
        </div>
        <div className="rounded-[5px] border border-line bg-panel/80 p-4">
          <Eyebrow>What did not happen</Eyebrow>
          <ul className="mt-2 space-y-1.5 text-[10.5px] text-muted">
            <li className="flex items-start gap-2"><Icon name="x" size={11} className="mt-0.5 text-muted/60" /> No data was synchronized to a second device or hunter.</li>
            <li className="flex items-start gap-2"><Icon name="x" size={11} className="mt-0.5 text-muted/60" /> No video proof was recorded, previewed or uploaded.</li>
            <li className="flex items-start gap-2"><Icon name="x" size={11} className="mt-0.5 text-muted/60" /> No health, heart-rate or sleep measurement was created.</li>
          </ul>
        </div>
      </div>

      <p className="text-center font-display text-[11px] italic text-muted/55">
        “The ascent is not a moment. It is the record of showing up.”
      </p>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="rounded-[4px] border border-line/80 bg-black/25 px-2 py-3">
      <p className={cn("tabular font-display text-[20px] leading-none", tone === "gold" ? "text-[#efd8ae]" : "text-[#e6ddcd]")}>{value}</p>
      <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.12em] text-muted/65">{label}</p>
    </div>
  );
}
