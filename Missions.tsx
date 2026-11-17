import { useMemo, useState } from "react";
import { DAY_LABELS, dayShort, formatDuration } from "@/lib/date";
import { navigate } from "@/lib/router";
import { missionBonus, exerciseDosage, exerciseRest, exerciseXp } from "@/lib/scoring";
import { basicsCompletion, completionFor, sessionPlanSeconds, sessionProgress } from "@/lib/selectors";
import { useHunter } from "@/lib/store";
import type { Session, SessionType } from "@/lib/types";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  ExerciseCheckbox,
  Eyebrow,
  GreekKey,
  Icon,
  Modal,
  Pill,
  ProgressBar,
  SectionHeader,
} from "@/components/ui";
import { LocalDataBadge } from "@/components/widgets";

const FILTERS: ("All" | SessionType)[] = ["All", "Strength", "Mobility", "Conditioning", "Recovery"];

export function Missions() {
  const {
    state,
    activeMember,
    stats,
    todaySession,
    todayDate,
    setPlannedMinutes,
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
    beginMission,
  } = useHunter();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [editing, setEditing] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", sets: 3, reps: 10, restSec: 60 });

  const basics = basicsCompletion(state, activeMember.id, state.dailyBasics, todayDate);
  const todayProgress = sessionProgress(state, activeMember.id, todaySession, todayDate);
  const plannedMinutes = state.plannedMinutes;
  const todayIndex = (new Date().getDay() + 6) % 7;
  const sessions = useMemo(
    () => state.schedule.filter((session) => filter === "All" || session.type === filter),
    [state.schedule, filter],
  );
  const weekVolume = useMemo(
    () => state.schedule.reduce((sum, session) => sum + sessionPlanSeconds(session), 0),
    [state.schedule],
  );

  const launch = (session: Session) => {
    beginMission(session.id);
    navigate(`workout/${session.id}`);
  };

  const handleAddSupplementary = () => {
    addSupplementary(draft);
    setDraft({ name: "", sets: 3, reps: 10, restSec: 60 });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-fade flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            <Eyebrow className="text-gold/80">Training protocol</Eyebrow>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-muted/50 sm:inline">/ permanent foundations</span>
          </div>
          <h1 className="mt-1.5 font-display text-[24px] font-medium leading-tight text-[#f0ebdf] sm:text-[28px]">
            Daily Missions &amp; Training
          </h1>
          <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-muted">
            Mobility, strength, walking and conditioning across the week. Check off what you complete — XP is written to
            your local record immediately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalDataBadge />
          <Button
            variant={editing ? "gold" : "secondary"}
            size="sm"
            icon={editing ? "check" : "edit"}
            onClick={() => setEditing((value) => !value)}
            aria-pressed={editing}
          >
            {editing ? "Finish editing" : "Edit schedule"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-orange/25 bg-orange/[0.055] px-3.5 py-2.5">
          <div className="flex items-start gap-2">
            <Icon name="info" size={14} className="mt-0.5 text-orange/85" />
            <p className="text-[10.5px] leading-relaxed text-[#d8c7b1]">
              Schedule editing is live. Change names, volume, duration and rest per movement. Completed check-offs on
              today's card remain; records already written to the ledger are preserved, not silently rewritten.
            </p>
          </div>
          <Button variant="danger" size="sm" icon="refresh" onClick={() => setRestoreOpen(true)}>
            Restore defaults
          </Button>
        </div>
      ) : null}

      {/* Today's protocol */}
      <Card className="hero-wash animate-rise overflow-hidden border-gold/20">
        <GreekKey className="opacity-50" />
        <div className="grid gap-0 lg:grid-cols-[1.02fr_1fr]">
          <div className="relative border-b border-line/70 p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="orange" dot>
                Today · {DAY_LABELS[todayIndex]}
              </Pill>
              <Pill tone="dark">{todaySession?.type ?? "Protocol"}</Pill>
              <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-muted/70">
                {todayProgress.completed}/{todayProgress.total} recorded
              </span>
            </div>
            <h2 className="mt-2.5 font-display text-[25px] leading-tight text-[#f4ecdc] sm:text-[29px]">
              {todaySession?.title ?? "No session assigned"}
            </h2>
            <p className="mt-1 text-[11px] text-[#bfae93]">
              {todaySession?.focus} · {todaySession?.recovery ? "restoration" : "apex protocol"}
            </p>
            <p className="mt-2 max-w-md border-l border-gold/25 pl-2.5 text-[10.5px] leading-relaxed text-muted">
              {todaySession?.note}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Protocol" value={`${todaySession?.minutes ?? 0} min`} />
              <MiniStat label="Volume" value={formatDuration(todaySession ? sessionPlanSeconds(todaySession) : 0)} />
              <MiniStat label="Streak" value={`${stats.streak} days`} />
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-sans text-[9px] uppercase tracking-[0.13em] text-muted/75">Session length</span>
                <span className="font-mono text-[9px] text-gold/80">+{missionBonus(plannedMinutes)} XP bonus</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 15, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setPlannedMinutes(minutes)}
                    aria-pressed={plannedMinutes === minutes}
                    className={cn(
                      "min-h-8 rounded-[3px] border font-sans text-[10px] transition-all",
                      plannedMinutes === minutes
                        ? "border-orange/55 bg-orange/[0.13] text-[#ffcb96]"
                        : "border-line bg-black/25 text-muted hover:border-gold/30",
                    )}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" icon="play" disabled={!todaySession} onClick={() => todaySession && launch(todaySession)} className="sm:flex-1">
                Launch today's chamber
              </Button>
              <Button
                variant="secondary"
                icon="check"
                disabled={
                  !todaySession ||
                  todayProgress.total === 0 ||
                  todayProgress.completed === todayProgress.total
                }
                onClick={() => {
                  if (!todaySession) return;
                  const next = todaySession.exercises.find(
                    (exercise) =>
                      !completionFor(state, activeMember.id, todayDate, todaySession.id, exercise.id),
                  );
                  if (next) toggleSessionExercise(todaySession, next);
                }}
              >
                Log next exercise
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader icon="sword" title="Exercise checklist" subtitle="Each completed movement records XP and volume" />
              <span className="font-display text-[18px] text-[#eadfc8]">{todayProgress.percent}%</span>
            </div>
            <ProgressBar value={todayProgress.percent} tone="orange" className="mt-2" />
            <div className="mt-2">
              {todaySession ? (
                todaySession.exercises.map((exercise) => {
                  const done = Boolean(
                    completionFor(state, activeMember.id, todayDate, todaySession.id, exercise.id),
                  );
                  return (
                    <div
                      key={exercise.id}
                      className={cn(
                        "flex items-start gap-2.5 border-b border-line/60 py-2.5 last:border-b-0",
                        done && "opacity-65",
                      )}
                    >
                      <ExerciseCheckbox
                        checked={done}
                        onChange={() => toggleSessionExercise(todaySession, exercise)}
                        label={`${done ? "Uncheck" : "Complete"} ${exercise.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-medium leading-snug text-[#e1dcd1]">{exercise.name}</p>
                        <p className="mt-0.5 font-mono text-[9px] text-muted/85">
                          {exerciseDosage(exercise)} <span className="text-line-bright">·</span> {exerciseRest(exercise)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[9px] text-gold/60">+{exerciseXp(exercise)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-[11px] text-muted">No exercises assigned today.</p>
              )}
            </div>
            <div className="mt-3 rounded-[4px] border border-line/70 bg-black/20 px-3 py-2">
              <div className="flex items-start gap-2">
                <Icon name="info" size={12} className="mt-0.5 text-gold/65" />
                <p className="text-[9.5px] leading-relaxed text-muted/80">
                  Check-offs apply to today's date and survive refresh. A bonus is awarded once all protocol movements are
                  complete. The timer by itself is not a completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily foundations */}
      <Card className="animate-rise overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <SectionHeader icon="leaf" title="Permanent daily basics" subtitle="Foundation mobility · every day, no exceptions" />
          <div className="flex items-center gap-2">
            <Pill tone="teal">{basics.completed}/{basics.total} today</Pill>
            <Pill tone="dark">Resets by date</Pill>
          </div>
        </div>
        <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
          {state.dailyBasics.map((drill) => {
            const done = Boolean(state.completions[`${activeMember.id}|${todayDate}|daily-basics|${drill.id}`]);
            const icon = drill.icon as "leaf" | "shoulder" | "hip" | "ankle";
            return (
              <button
                type="button"
                key={drill.id}
                onClick={() => toggleBasic(drill)}
                aria-pressed={done}
                className={cn(
                  "group relative overflow-hidden rounded-[4px] border p-3 text-left transition-all",
                  done
                    ? "border-teal/30 bg-[linear-gradient(140deg,rgba(125,182,166,0.09),rgba(0,0,0,0.15))]"
                    : "border-line bg-[linear-gradient(140deg,rgba(255,255,255,0.025),rgba(0,0,0,0.15))] hover:border-gold/35",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-[3px] border", done ? "border-teal/35 bg-teal/10 text-teal" : "border-gold/20 bg-gold/[0.06] text-gold/80")}>
                    <Icon name={icon} size={15} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-[8.5px] text-gold/60">+10 XP</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-[19px] w-[19px] place-items-center rounded-[3px] border",
                        done ? "border-[#df8a2d] bg-[#d98122] text-[#201407]" : "border-[#474a54] bg-black/30 text-transparent",
                      )}
                    >
                      <Icon name="check" size={12} strokeWidth={2.3} />
                    </span>
                  </span>
                </div>
                <p className="mt-2 font-display text-[14px] leading-tight text-[#e9e1d1]">{drill.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[9.5px] text-muted/80">{drill.subtitle}</p>
                <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-1.5 font-mono text-[8.5px] text-muted/70">
                  <span>{drill.sets} sets {drill.reps}</span>
                  <span>{drill.minutes} min</span>
                  <span>rest {drill.restSec}s</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line/70 px-4 py-2.5 sm:px-5">
          <ProgressBar value={basics.percent} tone="teal" className="flex-1" />
          <span className="shrink-0 font-mono text-[9px] text-muted/70">{basics.percent}% held today</span>
        </div>
      </Card>

      {/* Weekly schedule */}
      <div className="animate-rise flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon="calendar" title="Weekly training schedule" subtitle="Monday through Sunday · a structured progression" />
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 hidden items-center gap-1 font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/60 sm:flex">
            <Icon name="filter" size={11} /> Sector
          </span>
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={cn(
                "rounded-[3px] border px-2 py-1 font-sans text-[8.5px] font-semibold uppercase tracking-[0.1em] transition-colors",
                filter === item
                  ? "border-gold/40 bg-gold/10 text-[#ecd7b4]"
                  : "border-line bg-black/20 text-muted/75 hover:border-gold/25 hover:text-[#cec5b4]",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => {
          const isToday = session.day === dayShort();
          const progress = sessionProgress(state, activeMember.id, session, todayDate);
          return (
            <Card
              key={session.id}
              className={cn(
                "flex flex-col overflow-hidden transition-colors",
                isToday ? "border-gold/35 shadow-[0_12px_45px_-30px_rgba(214,183,127,0.5)]" : "hover:border-[#383b45]",
                session.recovery && "bg-[linear-gradient(160deg,rgba(125,182,166,0.035),rgba(18,20,25,0.9))]",
              )}
            >
              {isToday ? <div className="h-[2px] w-full bg-[linear-gradient(90deg,#b98a4d,#f0962f,#b98a4d)]" /> : null}
              <div className="flex items-start justify-between gap-2 px-3.5 pb-2.5 pt-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "grid min-w-[38px] place-items-center rounded-[3px] border px-1.5 py-1 font-sans text-[8.5px] font-bold uppercase tracking-[0.12em]",
                      isToday ? "border-orange/45 bg-orange/10 text-[#ffc48b]" : "border-line bg-white/[0.02] text-muted",
                    )}
                  >
                    {session.day}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">{session.focus}</p>
                    <p className="truncate font-mono text-[8px] text-muted/50">
                      {session.exercises.length} movements · {session.minutes} min
                    </p>
                  </div>
                </div>
                {isToday ? (
                  <Pill tone="orange" dot>
                    Today
                  </Pill>
                ) : session.recovery ? (
                  <Pill tone="teal">Recovery</Pill>
                ) : (
                  <Pill tone="dark">Scheduled</Pill>
                )}
              </div>

              {editing ? (
                <div className="space-y-2 px-3.5 pb-3">
                  <label className="block">
                    <span className="sr-only">Session title</span>
                    <input
                      className="field"
                      value={session.title}
                      onChange={(event) => updateSession(session.id, { title: event.target.value })}
                      placeholder="Session title"
                    />
                  </label>
                  <div className="grid grid-cols-[1fr_72px] gap-1.5">
                    <label>
                      <span className="sr-only">Focus</span>
                      <input
                        className="field"
                        value={session.focus}
                        onChange={(event) => updateSession(session.id, { focus: event.target.value })}
                        placeholder="Focus"
                      />
                    </label>
                    <label>
                      <span className="sr-only">Minutes</span>
                      <input
                        className="field tabular"
                        type="number"
                        min={5}
                        max={120}
                        value={session.minutes}
                        onChange={(event) => updateSession(session.id, { minutes: Math.max(5, Math.min(120, Number(event.target.value) || 5)) })}
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    {session.exercises.map((exercise) => (
                      <div key={exercise.id} className="rounded-[4px] border border-line bg-black/25 p-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            className="field"
                            value={exercise.name}
                            onChange={(event) => updateSessionExercise(session.id, exercise.id, { name: event.target.value })}
                            aria-label={`${exercise.name} name`}
                          />
                          <button
                            type="button"
                            onClick={() => removeSessionExercise(session.id, exercise.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-[3px] border border-line text-muted transition-colors hover:border-danger/40 hover:text-danger"
                            aria-label={`Remove ${exercise.name}`}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                          <FieldNumber label="Sets" value={exercise.sets} onChange={(value) => updateSessionExercise(session.id, exercise.id, { sets: value })} />
                          {exercise.durationSec !== undefined ? (
                            <FieldNumber
                              label="Sec/set"
                              value={exercise.durationSec}
                              onChange={(value) => updateSessionExercise(session.id, exercise.id, { durationSec: value })}
                            />
                          ) : (
                            <FieldNumber label="Reps" value={exercise.reps ?? 10} onChange={(value) => updateSessionExercise(session.id, exercise.id, { reps: value })} />
                          )}
                          <FieldNumber label="Rest s" value={exercise.restSec} onChange={(value) => updateSessionExercise(session.id, exercise.id, { restSec: value })} />
                          <button
                            type="button"
                            onClick={() => {
                              const next = session.exercises.find((item) => item.id === exercise.id);
                              if (!next) return;
                              updateSessionExercise(
                                session.id,
                                exercise.id,
                                next.durationSec !== undefined
                                  ? { durationSec: undefined, reps: next.reps ?? 10 }
                                  : { durationSec: 60, reps: undefined },
                              );
                            }}
                            className="mt-[15px] h-[34px] rounded-[3px] border border-line font-sans text-[8px] uppercase tracking-[0.06em] text-muted transition-colors hover:border-gold/30 hover:text-gold"
                          >
                            {exercise.durationSec !== undefined ? "To reps" : "To time"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSessionExercise(session.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[3px] border border-dashed border-line py-1.5 font-sans text-[8.5px] uppercase tracking-[0.1em] text-muted/80 transition-colors hover:border-gold/35 hover:text-gold"
                  >
                    <Icon name="plus" size={11} /> Add movement
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-3.5">
                    <h3 className="font-display text-[17px] leading-tight text-[#ebe3d4]">{session.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted/80">
                      <Icon name={session.type === "Recovery" ? "leaf" : session.type === "Mobility" ? "walk" : session.type === "Conditioning" ? "bolt" : "dumbbell"} size={11} className="text-gold/55" />
                      {session.type}
                      <span className="text-line-bright">·</span>
                      {session.recovery ? "Restoration protocol" : "Protocol"}
                    </p>
                  </div>
                  <div className="mt-2 flex-1 px-3.5">
                    {session.exercises.map((exercise) => {
                      const done = Boolean(completionFor(state, activeMember.id, todayDate, session.id, exercise.id));
                      return (
                        <div key={exercise.id} className={cn("flex items-start gap-2 border-b border-line/50 py-[7px] last:border-b-0", done && "opacity-60")}>
                          <ExerciseCheckbox
                            checked={done}
                            onChange={() => toggleSessionExercise(session, exercise)}
                            label={`${done ? "Uncheck" : "Complete"} ${exercise.name} for today`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10.5px] font-medium text-[#d8d3c8]">{exercise.name}</p>
                            <p className="font-mono text-[8px] text-muted/70">
                              {exerciseDosage(exercise)} · {exerciseRest(exercise)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="mt-2 border-t border-line/60 px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <ProgressBar value={progress.percent} tone={progress.completed === progress.total && progress.total > 0 ? "teal" : isToday ? "orange" : "gold"} height="h-1" />
                  <span className="shrink-0 font-mono text-[8px] text-muted/65">{progress.completed}/{progress.total}</span>
                </div>
                {!editing ? (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-muted/55">
                      {session.recovery ? "Restore, don't force" : `+${missionBonus(plannedMinutes)} bonus`}
                    </span>
                    <button
                      type="button"
                      onClick={() => launch(session)}
                      className="group inline-flex items-center gap-1 font-sans text-[8.5px] font-semibold uppercase tracking-[0.1em] text-gold/85 transition-colors hover:text-gold"
                    >
                      Log session <Icon name="play" size={9} />
                    </button>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {filter !== "All" && !sessions.length ? (
        <div className="rounded-[4px] border border-dashed border-line bg-black/20 py-8 text-center text-[11px] text-muted">
          No {filter.toLowerCase()} sessions in the protocol. Edit the schedule to add one.
        </div>
      ) : null}

      <div className="animate-rise grid w-full gap-2.5 rounded-[5px] border border-line/80 bg-[linear-gradient(120deg,rgba(214,183,127,0.045),rgba(0,0,0,0.16))] p-3.5 sm:col-span-2 sm:grid-cols-[1.3fr_1fr_1fr] xl:grid-cols-[1.6fr_1fr_1fr_auto] xl:items-center">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-gold/70">
            <Icon name="shield" size={15} />
          </span>
          <div>
            <Eyebrow className="text-gold/75">The covenant standard</Eyebrow>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted/85">
              Seven scheduled sessions, four permanent foundations. Choose honest effort over volume and keep the record
              truthful.
            </p>
          </div>
        </div>
        <div className="rounded-[3px] border border-line/70 bg-black/20 px-2.5 py-2">
          <p className="font-sans text-[8px] uppercase tracking-[0.1em] text-muted/60">Weekly planned volume</p>
          <p className="mt-0.5 font-mono text-[11px] text-[#e3d9c7]">{formatDuration(weekVolume)}</p>
        </div>
        <div className="rounded-[3px] border border-line/70 bg-black/20 px-2.5 py-2">
          <p className="font-sans text-[8px] uppercase tracking-[0.1em] text-muted/60">Today's mission mark</p>
          <p className={cn("mt-0.5 font-mono text-[11px]", state.completedDays[activeMember.id]?.includes(todayDate) ? "text-teal" : "text-[#e3d9c7]")}>
            {state.completedDays[activeMember.id]?.includes(todayDate) ? "Recorded" : "Not yet recorded"}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon="user" onClick={() => navigate("profile")} className="xl:justify-self-end">
          Open dossier
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        {/* Supplementary */}
        <Card className="animate-rise overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3 sm:px-5">
            <SectionHeader icon="plus" title="Supplementary exercises" subtitle="Optional additions · never part of mission completion" />
            <Pill tone="teal">{state.supplementary.length} added</Pill>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_74px_74px_86px_auto]">
              <label className="block">
                <span className="mb-1 block font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Exercise</span>
                <input
                  className="field"
                  placeholder="e.g. Band pull-apart"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddSupplementary();
                  }}
                  maxLength={48}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Sets</span>
                <input
                  className="field tabular"
                  type="number"
                  min={1}
                  max={20}
                  value={draft.sets}
                  onChange={(event) => setDraft((current) => ({ ...current, sets: Number(event.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Reps</span>
                <input
                  className="field tabular"
                  type="number"
                  min={1}
                  max={100}
                  value={draft.reps}
                  onChange={(event) => setDraft((current) => ({ ...current, reps: Number(event.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-sans text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Rest (s)</span>
                <input
                  className="field tabular"
                  type="number"
                  min={0}
                  max={600}
                  step={15}
                  value={draft.restSec}
                  onChange={(event) => setDraft((current) => ({ ...current, restSec: Number(event.target.value) }))}
                />
              </label>
              <div className="flex items-end">
                <Button variant="primary" icon="plus" onClick={handleAddSupplementary} className="w-full sm:w-auto">
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-3">
              {state.supplementary.length ? (
                <ul className="divide-y divide-line/60">
                  {state.supplementary.map((exercise) => {
                    const done = Boolean(state.completions[`${activeMember.id}|${todayDate}|supplementary|${exercise.id}`]);
                    return (
                      <li key={exercise.id} className="flex items-center gap-2.5 py-2.5">
                        <ExerciseCheckbox checked={done} onChange={() => toggleSupplementary(exercise)} label={`${done ? "Uncheck" : "Complete"} ${exercise.name}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium text-[#ded9ce]">{exercise.name}</p>
                          <p className="font-mono text-[8.5px] text-muted/70">
                            {exerciseDosage({ ...exercise, reps: exercise.reps })} · {exerciseRest(exercise)} · +{exerciseXp(exercise)} XP
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSupplementary(exercise.id)}
                          aria-label={`Remove supplementary exercise ${exercise.name}`}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-line text-muted transition-colors hover:border-danger/40 hover:text-danger"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-[4px] border border-dashed border-line bg-black/20 px-4 py-5 text-center">
                  <Icon name="plus" size={17} className="mx-auto mb-1.5 text-gold/45" />
                  <p className="text-[10.5px] text-muted">No supplementary movements. Add optional work above.</p>
                  <p className="mt-0.5 text-[9px] text-muted/60">Supplementary work earns XP but never completes the daily mission.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Protocol note / recovery */}
        <div className="space-y-4">
          <Card className="animate-rise overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <SectionHeader icon="sun" title="Recovery directive" subtitle="One day in seven belongs to restoration" />
              <Pill tone="teal">Sunday</Pill>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-teal/25 bg-teal/[0.06] text-teal">
                  <Icon name="leaf" size={17} />
                </span>
                <div>
                  <p className="font-display text-[15px] text-[#e8e1d3]">The Lotus of Lethe</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                    Twenty easy minutes: walk, stretch, breathe. No clinical measurements are claimed by this system —
                    record only what you actually complete.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="dark">Easy walk</Pill>
                <Pill tone="dark">Range of motion</Pill>
                <Pill tone="dark">Breathing</Pill>
              </div>
              <button
                type="button"
                onClick={() => {
                  const recovery = state.schedule.find((session) => session.id === "recovery");
                  if (recovery) launch(recovery);
                }}
                className="mt-3 flex w-full items-center justify-between rounded-[4px] border border-line bg-black/20 px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.1em] text-gold/80 transition-colors hover:border-teal/30 hover:text-teal"
              >
                Open restoration protocol
                <Icon name="arrowRight" size={12} />
              </button>
            </div>
          </Card>

          <div className="animate-rise rounded-[5px] border border-line/80 bg-[linear-gradient(140deg,rgba(214,183,127,0.045),rgba(0,0,0,0.15))] p-4">
            <div className="flex items-start gap-2.5">
              <Icon name="shield" size={15} className="mt-0.5 text-gold/70" />
              <div>
                <Eyebrow className="text-gold/75">Covenant discipline</Eyebrow>
                <p className="mt-1.5 font-display text-[13px] italic leading-relaxed text-[#cfc5b3]">
                  “Small deeds done are better than great deeds planned.”
                </p>
                <p className="mt-2 text-[9.5px] leading-relaxed text-muted/75">
                  Weekly volume: {formatDuration(weekVolume)} across {state.schedule.length} scheduled sessions. Your local
                  record persists on this device; synchronization remains off until Supabase is configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore the default protocol?"
        eyebrow="Schedule reset"
        width="max-w-md"
      >
        <p className="text-[12px] leading-relaxed text-muted">
          This replaces all schedule edits with the original seven-session protocol and clears today's local check-offs
          for the current hunter. Previous days' records remain in the ledger. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRestoreOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon="refresh"
            onClick={() => {
              restoreSchedule();
              setRestoreOpen(false);
              setEditing(false);
            }}
          >
            Restore defaults
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[3px] border border-line/70 bg-black/25 px-2 py-1.5">
      <p className="truncate font-mono text-[10px] text-[#e0d7c6]">{value}</p>
      <p className="mt-0.5 truncate font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/65">{label}</p>
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block font-sans text-[7.5px] uppercase tracking-[0.08em] text-muted/65">{label}</span>
      <input
        className="field tabular min-h-[30px] px-1.5 py-1 text-[10px]"
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
