import { useMemo } from "react";
import { navigate } from "@/lib/router";
import { formatDuration, formatInvocation, formatNumber } from "@/lib/date";
import { exerciseDosage, exerciseRest, exerciseXp, missionBonus } from "@/lib/scoring";
import { basicsCompletion, leaderboard, recentActivity, sessionProgress, todayActivity } from "@/lib/selectors";
import { useHunter } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Emblem,
  Eyebrow,
  Icon,
  MemberAvatar,
  Pill,
  ProgressBar,
  RingProgress,
  SectionHeader,
  ExerciseCheckbox,
} from "@/components/ui";
import { ActivityFeed, ConsistencyPanel, LocalDataBadge, StreakDots } from "@/components/widgets";

export function Dashboard() {
  const {
    state,
    activeMember,
    stats,
    todaySession,
    todayDate,
    setPlannedMinutes,
    beginMission,
    toggleSessionExercise,
    toggleBasic,
    notify,
  } = useHunter();

  const plannedMinutes = state.plannedMinutes;
  const progress = sessionProgress(state, activeMember.id, todaySession, todayDate);
  const basics = basicsCompletion(state, activeMember.id, state.dailyBasics, todayDate);
  const board = useMemo(() => leaderboard(state), [state]);
  const feed = useMemo(() => recentActivity(state, undefined, 6), [state]);
  const todayEntries = useMemo(() => todayActivity(state, activeMember.id).filter((entry) => !entry.seed), [state, activeMember.id]);
  const todayXp = todayEntries.reduce((sum, entry) => sum + entry.xp, 0);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const weeklyGoal = 2500;
  const weeklyGoalPercent = Math.round((stats.weeklyXp / weeklyGoal) * 100);
  const missionDone = progress.total > 0 && progress.completed === progress.total;
  const sessionIsRecovery = todaySession?.recovery;

  const launch = () => {
    if (!todaySession) {
      navigate("missions");
      return;
    }
    beginMission(todaySession.id);
    navigate(`workout/${todaySession.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-fade flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            <Eyebrow className="text-gold/80">Tactical overview</Eyebrow>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-muted/50 sm:inline">/ Two-hunter system</span>
          </div>
          <h1 className="mt-1.5 font-display text-[24px] font-medium leading-tight tracking-[0.01em] text-[#f0ebdf] sm:text-[28px]">
            Hunter Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-muted">
            The covenant record at a glance — training, consistency and the daily protocol.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalDataBadge />
          <Pill tone="dark" className="normal-case tracking-[0.06em]">
            <Icon name="calendar" size={11} />
            {formatInvocation()}
          </Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Welcome and core telemetry */}
        <Card
          glow
          className="corner-brackets hero-wash noise animate-rise relative overflow-hidden xl:col-span-8"
        >
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[42%] overflow-hidden md:block">
            <div className="absolute right-[-28px] top-1/2 -translate-y-1/2 text-gold/[0.045]">
              <Emblem size={310} />
            </div>
            <div className="absolute right-10 top-8 h-px w-32 bg-gradient-to-r from-transparent to-gold/20" />
            <div className="absolute right-10 top-8 h-24 w-px bg-gradient-to-b from-gold/20 to-transparent" />
            <p className="absolute bottom-6 right-8 font-display text-[10px] uppercase tracking-[0.32em] text-gold/25">
              ἀρετή · excellence
            </p>
          </div>

          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="gold" dot>
                Sector telemetry
              </Pill>
              <span className="font-sans text-[9px] uppercase tracking-[0.16em] text-muted/70">
                {activeMember.title} · {activeMember.joined}
              </span>
            </div>

            <div className="mt-4 max-w-xl">
              <h2 className="font-display text-[27px] font-medium leading-[1.14] tracking-[0.005em] text-[#f4efe4] sm:text-[33px] lg:text-[37px]">
                Welcome back,
                <br />
                Hunter <span className="gold-text">{activeMember.name}</span>.
              </h2>
              <p className="mt-2 max-w-md text-[11.5px] leading-relaxed text-[#9b9a96] sm:text-[12px]">
                {sessionIsRecovery
                  ? "The hall is quiet today. Your restoration protocol is prepared — move gently and keep the covenant."
                  : "Your daily protocol is prepared. The covenant waits for no one; one honest session is enough to advance."}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={sessionIsRecovery ? "leaf" : "play"} onClick={launch} className="min-w-[160px]">
                {sessionIsRecovery ? "Enter restoration" : "Start Mission"}
              </Button>
              <Button variant="secondary" size="md" icon="target" onClick={() => navigate("missions")}>
                Review protocol
              </Button>
              {todayXp > 0 ? (
                <span className="ml-1 font-mono text-[10px] text-teal/85">+{todayXp} XP today</span>
              ) : (
                <span className="ml-1 hidden font-sans text-[9px] uppercase tracking-[0.1em] text-muted/55 sm:inline">
                  XP only when completed
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-y-3 border-y border-white/[0.07] py-3.5 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.07] sm:gap-y-0">
              <StatTile
                label="Total XP"
                value={formatNumber(stats.totalXp)}
                note={stats.totalLocalXp > 0 ? `+${stats.totalLocalXp} local` : "Lifetime ascent"}
                icon="spark"
              />
              <StatTile
                label="Current streak"
                value={`${stats.streak}`}
                suffix="days"
                note={stats.streak > 0 ? "Unbroken discipline" : "Begin the chain"}
                icon="flame"
                className="sm:pl-4"
              />
              <StatTile
                label="Weekly completion"
                value={`${stats.weeklyConsistency}`}
                suffix="%"
                note={`${stats.weeklyDays.filter(Boolean).length} of 7 days`}
                icon="target"
                className="sm:pl-4"
              />
              <StatTile
                label="Exercise time"
                value={formatDuration(stats.totalSeconds)}
                note="Recorded volume"
                icon="clock"
                className="sm:pl-4"
              />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icon name="activity" size={13} className="text-gold/65" />
                <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-muted/75">This week's cadence</span>
                <StreakDots days={stats.weeklyDays} todayIndex={todayIndex} compact showLabels={false} />
              </div>
              <button
                type="button"
                onClick={() => navigate("profile")}
                className="group inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-gold/80 transition-colors hover:text-gold"
              >
                Full dossier
                <Icon name="arrowUpRight" size={12} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Rank ascent */}
        <Card className="panel-sheen animate-rise relative overflow-hidden xl:col-span-4" >
          <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
            <div>
              <Eyebrow>Ascent record</Eyebrow>
              <p className="mt-1 font-display text-[16px] text-parchment">{stats.rank === "B" ? "Gold Hunter" : `${stats.rank}-Rank Hunter`}</p>
            </div>
            <Pill tone="gold" dot>
              Licensed
            </Pill>
          </div>
          <div className="relative px-4 py-5">
            <div className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-40 w-40 rounded-full bg-orange/[0.06] blur-2xl" />
            <div className="relative flex flex-col items-center">
              <RingProgress value={stats.rankProgress * 100} size={168} stroke={5} tone="gold">
                <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-muted">Level</span>
                <span className="tabular font-display text-[46px] font-medium leading-none text-[#f2e9d7]">{stats.level}</span>
                <span className="mt-1.5 inline-flex items-center gap-1.5">
                  <span className="font-sans text-[8px] uppercase tracking-[0.15em] text-muted/75">Class</span>
                  <span className="font-display text-[13px] text-gold">{stats.rank}</span>
                  <span className="font-sans text-[8px] uppercase tracking-[0.12em] text-orange/80">Rank</span>
                </span>
              </RingProgress>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
                {stats.nextRankXp ? (
                  <>
                    <span className="font-mono text-gold">{formatNumber(Math.max(0, stats.nextRankXp - stats.totalXp))} XP</span> to reach{" "}
                    <span className="text-[#d7c8ae]">Rank {stats.nextRank}</span>
                  </>
                ) : (
                  "The highest recorded rank. Guard it well."
                )}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MicroStat label="Weekly XP" value={formatNumber(stats.weeklyXp)} />
              <MicroStat label="Streak" value={`${stats.streak}d`} />
              <MicroStat label="Missions" value={`${stats.completedMissions}`} />
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[9px] uppercase tracking-[0.13em] text-muted/75">Weekly target</span>
                <span className="font-mono text-[9px] text-gold/85">
                  {formatNumber(stats.weeklyXp)} / {formatNumber(weeklyGoal)}
                </span>
              </div>
              <ProgressBar value={weeklyGoalPercent} tone="orange" className="mt-1.5" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              {(["E", "D", "C", "B", "A", "S"] as const).map((rank, index) => {
                const ranks = ["E", "D", "C", "B", "A", "S"];
                const currentIndex = ranks.indexOf(stats.rank);
                const reached = index <= currentIndex;
                return (
                  <div key={rank} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border font-display text-[9px]",
                        reached ? "border-gold/50 bg-gold/10 text-gold" : "border-line bg-black/30 text-muted/45",
                        rank === stats.rank && "border-orange/60 bg-orange/15 text-orange shadow-[0_0_10px_-2px_rgba(240,150,47,0.5)]",
                      )}
                    >
                      {rank}
                    </span>
                    <span className={cn("h-px w-full", reached ? "bg-gold/20" : "bg-line/60")} />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Assigned mission */}
        <Card className="animate-rise overflow-hidden xl:col-span-7" >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line/70 px-4 py-3 sm:px-5">
            <SectionHeader
              icon="target"
              title="Assigned daily mission"
              subtitle={todaySession ? `${todaySession.day} · ${todaySession.type} sector` : "No protocol assigned"}
              action={
                <div className="flex items-center gap-1.5">
                  <Pill tone="dark">{todaySession?.type ?? "Rest"}</Pill>
                  {missionDone ? <Pill tone="teal">Complete</Pill> : <Pill tone="orange">Prepared</Pill>}
                </div>
              }
            />
          </div>

          {todaySession ? (
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-[9px] uppercase tracking-[0.16em] text-orange/80">
                      {sessionIsRecovery ? "Restoration protocol" : "Heracles protocol · apex training"}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-[22px] leading-tight text-[#f1e9d9] sm:text-[24px]">{todaySession.title}</h3>
                  <p className="mt-0.5 text-[11px] text-muted">{todaySession.focus}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="dark">{progress.completed}/{progress.total} logged</Pill>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-orange/25 bg-orange/[0.07] font-display text-[13px] text-orange">
                    {sessionIsRecovery ? <Icon name="leaf" size={14} /> : <Icon name="sword" size={14} />}
                  </span>
                </div>
              </div>

              <p className="mt-2 max-w-2xl border-l border-gold/25 pl-2.5 text-[10.5px] leading-relaxed text-muted/85">
                {todaySession.note}
              </p>

              <div className="mt-3.5 grid gap-x-4 gap-y-0 sm:grid-cols-2">
                {todaySession.exercises.map((exercise) => {
                  const done = Boolean(state.completions[`${activeMember.id}|${todayDate}|${todaySession.id}|${exercise.id}`]);
                  return (
                    <div
                      key={exercise.id}
                      className={cn(
                        "flex items-start gap-2.5 border-b border-line/55 py-2.5 last:border-b-0",
                        done && "opacity-70",
                      )}
                    >
                      <ExerciseCheckbox
                        checked={done}
                        onChange={() => toggleSessionExercise(todaySession, exercise)}
                        label={`${done ? "Uncheck" : "Complete"} ${exercise.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[11.5px] font-medium leading-snug text-[#ded9ce]", done && "text-[#c5bda9]")}>{exercise.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[9px] text-muted/85">
                          <span>{exerciseDosage(exercise)}</span>
                          <span className="text-line-bright">·</span>
                          <span>{exerciseRest(exercise)}</span>
                          {exercise.optional ? (
                            <>
                              <span className="text-line-bright">·</span>
                              <span className="text-teal/75">optional</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 font-mono text-[9px] text-gold/50">+{exerciseXp(exercise)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-sans text-[9px] uppercase tracking-[0.12em] text-muted/70">
                  Session length <span className="ml-1 text-[#d3c8b5]">{plannedMinutes} min</span>
                </span>
                <span className="font-mono text-[9px] text-gold/75">
                  +{missionBonus(plannedMinutes)} XP completion bonus
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {[10, 15, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setPlannedMinutes(minutes)}
                    className={cn(
                      "min-h-8 rounded-[3px] border font-sans text-[10px] font-medium transition-all",
                      plannedMinutes === minutes
                        ? "border-orange/55 bg-orange/[0.13] text-[#ffcb96] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "border-line bg-black/25 text-muted hover:border-gold/30 hover:text-[#cdc6b8]",
                    )}
                    aria-pressed={plannedMinutes === minutes}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>

              <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="primary" icon="play" onClick={launch} className="sm:flex-1">
                  {missionDone ? "Review in chamber" : "Enter Workout Chamber"}
                </Button>
                <Button variant="ghost" size="md" icon="arrowUpRight" onClick={() => navigate("missions")}>
                  All sessions
                </Button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <Icon name="info" size={11} className="text-muted/60" />
                <p className="text-[9px] leading-relaxed text-muted/70">
                  Completing each exercise records its XP locally. Starting or leaving the timer alone grants nothing.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 text-[12px] text-muted">The schedule is empty. Open mission command to add a protocol.</div>
          )}
        </Card>

        {/* Squad standings */}
        <Card className="animate-rise flex flex-col overflow-hidden xl:col-span-5">
          <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3 sm:px-5">
            <SectionHeader icon="users" title="Squad standings" subtitle="The covenant · exactly two hunters" />
            <Pill tone="gold" dot>
              This week
            </Pill>
          </div>
          <div className="flex-1 p-3 sm:p-4">
            <div className="space-y-2">
              {board.map((entry, index) => {
                const isActive = entry.member.id === activeMember.id;
                const maxXp = Math.max(...board.map((row) => row.weeklyXp), 1);
                return (
                  <div
                    key={entry.member.id}
                    className={cn(
                      "rounded-[5px] border p-3 transition-colors",
                      isActive
                        ? "border-gold/25 bg-[linear-gradient(100deg,rgba(214,183,127,0.08),rgba(255,255,255,0.012))]"
                        : "border-line/80 bg-black/20",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center gap-1">
                        <MemberAvatar monogram={entry.member.monogram} name={entry.member.name} size={34} active={isActive} />
                        <span className="font-mono text-[8px] text-muted/55">#{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className="truncate font-display text-[14px] text-[#eee7d9]">{entry.member.name}</p>
                            {index === 0 ? <Icon name="crown" size={12} className="shrink-0 text-gold" /> : null}
                          </div>
                          <span className="shrink-0 font-mono text-[10px] font-medium text-[#e9d9b9]">{formatNumber(entry.weeklyXp)}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-sans text-[8px] uppercase tracking-[0.12em] text-muted/80">
                            Rank {entry.rank} · Lv. {entry.level}
                          </span>
                          {isActive ? <Pill tone="gold" className="px-1.5 py-0 text-[7px]">You</Pill> : <Pill tone="dark" className="px-1.5 py-0 text-[7px]">Demo ally</Pill>}
                        </div>
                        <ProgressBar value={(entry.weeklyXp / maxXp) * 100} tone={index === 0 ? "gold" : "muted"} className="mt-2" height="h-1" />
                        <div className="mt-1.5 flex items-center gap-3 font-mono text-[8.5px] text-muted/75">
                          <span className="flex items-center gap-1"><Icon name="flame" size={9} className="text-orange/70" />{entry.streak}d</span>
                          <span className="flex items-center gap-1"><Icon name="check" size={9} className="text-teal/70" />{entry.completedMissions}</span>
                          <span className="flex items-center gap-1"><Icon name="clock" size={9} className="text-gold/60" />{formatDuration(entry.totalSeconds)}</span>
                          <span className="ml-auto hidden text-[8px] uppercase tracking-[0.08em] text-muted/55 sm:inline">{entry.weeklyConsistency}% week</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-[4px] border border-line/70 bg-black/20 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] text-muted">
                  <Icon name="shield" size={11} className="text-gold/70" />
                  Covenant standard
                </span>
                <span className="font-mono text-[9px] text-gold/70">Reference</span>
              </div>
              <p className="mt-1 text-[9.5px] leading-relaxed text-muted/65">
                Both hunters hold a training mark this week. Seeded demo totals are shown for context; no shared reward
                is awarded until server-side validation exists.
              </p>
            </div>
          </div>
          <div className="border-t border-line/70 px-4 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => navigate("squad")}
              className="group flex w-full items-center justify-between font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-gold/80 transition-colors hover:text-gold"
            >
              <span>Open two-hunter chamber</span>
              <Icon name="arrowRight" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Card>

        {/* Foundations */}
        <Card className="animate-rise overflow-hidden xl:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3 sm:px-5">
            <SectionHeader icon="leaf" title="Daily foundations" subtitle="Permanent mobility basics · every day" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-gold/80">{basics.completed}/{basics.total}</span>
              <Button variant="ghost" size="sm" trailingIcon="arrowRight" onClick={() => navigate("missions")}>
                Details
              </Button>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {state.dailyBasics.map((drill) => {
                const done = Boolean(state.completions[`${activeMember.id}|${todayDate}|daily-basics|${drill.id}`]);
                const icon = drill.icon as "leaf" | "shoulder" | "hip" | "ankle";
                return (
                  <button
                    key={drill.id}
                    type="button"
                    onClick={() => toggleBasic(drill)}
                    className={cn(
                      "group flex min-h-[64px] items-start gap-2.5 rounded-[4px] border px-3 py-2.5 text-left transition-all",
                      done
                        ? "border-teal/25 bg-teal/[0.045]"
                        : "border-line/80 bg-black/20 hover:border-gold/30 hover:bg-white/[0.02]",
                    )}
                    aria-pressed={done}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border",
                        done ? "border-teal/35 bg-teal/10 text-teal" : "border-line bg-panel text-gold/70",
                      )}
                    >
                      <Icon name={done ? "check" : icon} size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11.5px] font-medium text-[#ded9ce]">{drill.title}</span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="font-mono text-[8.5px] text-gold/60">+10 XP</span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "grid h-[17px] w-[17px] place-items-center rounded-[2px] border",
                              done ? "border-[#df8a2d] bg-[#d98122] text-[#201407]" : "border-[#474a54] text-transparent",
                            )}
                          >
                            <Icon name="check" size={10} strokeWidth={2.4} />
                          </span>
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[9.5px] text-muted/80">{drill.subtitle}</span>
                      <span className="mt-1 block font-mono text-[8.5px] text-muted/60">
                        {drill.sets} sets {drill.reps} · rest {drill.restSec}s
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={basics.percent} tone="teal" className="flex-1" />
              <span className="font-mono text-[9px] text-muted/70">{basics.percent}% held</span>
            </div>
            <p className="mt-2 text-[9px] text-muted/60">
              Check off a foundation to record 10 XP and 4 minutes of mobility each. These are daily and reset by date,
              never by refresh.
            </p>
          </div>
        </Card>

        {/* Activity */}
        <Card className="animate-rise flex flex-col overflow-hidden xl:col-span-5">
          <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3 sm:px-5">
            <SectionHeader icon="activity" title="Squad dispatches" subtitle="Recent covenant activity" />
            <LocalDataBadge compact />
          </div>
          <div className="p-4 sm:p-5">
            <ActivityFeed entries={feed} members={state.members} max={5} />
          </div>
          <div className="mt-auto border-t border-line/70 px-4 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => navigate("profile")}
              className="group flex w-full items-center justify-between font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-gold/80 transition-colors hover:text-gold"
            >
              <span>Review full ledger</span>
              <Icon name="arrowRight" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:hidden">
        <ConsistencyPanel
          weeklyDays={stats.weeklyDays}
          weeklyPercent={stats.weeklyConsistency}
          monthlyPercent={stats.monthlyConsistency}
          todayIndex={todayIndex}
        />
        <div className="rounded-[4px] border border-line bg-panel/80 p-3.5">
          <div className="flex items-center gap-2">
            <Icon name="info" size={13} className="text-gold/65" />
            <Eyebrow>Data integrity</Eyebrow>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
            Seed totals are labelled; completed actions are written through the local data layer and survive a refresh.
            Supabase synchronization is not active.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-gold/80"
            onClick={() => notify("Local data layer", "Open the squad chamber for the full synchronization status.", "gold")}
          >
            <Icon name="database" size={11} /> Read data note
          </button>
        </div>
      </div>

      <div className="animate-fade flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3.5">
        <p className="max-w-lg font-display text-[11px] italic leading-relaxed text-muted/60">
          “We are what we repeatedly do. Excellence, then, is not an act, but a habit.” — after Aristotle
        </p>
        <span className="font-sans text-[8.5px] uppercase tracking-[0.2em] text-muted/45">
          {activeMember.handle} · Olympus protocol v1.0
        </span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  note,
  icon,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  note: string;
  icon: "spark" | "flame" | "target" | "clock";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={11} className="text-gold/60" />
        <span className="font-sans text-[8.5px] uppercase tracking-[0.14em] text-muted/80">{label}</span>
      </div>
      <p className="tabular mt-1 truncate font-display text-[22px] font-medium leading-none text-[#efe6d4] sm:text-[25px]">
        {value}
        {suffix ? <span className="ml-1 font-sans text-[10px] font-normal tracking-normal text-muted">{suffix}</span> : null}
      </p>
      <p className="mt-1 truncate text-[8.5px] uppercase tracking-[0.1em] text-muted/55">{note}</p>
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[3px] border border-line/70 bg-black/20 px-2 py-1.5 text-center">
      <p className="truncate font-mono text-[10.5px] text-[#e7ddca]">{value}</p>
      <p className="mt-0.5 truncate font-sans text-[8px] uppercase tracking-[0.08em] text-muted/65">{label}</p>
    </div>
  );
}
