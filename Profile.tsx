import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatInvocation, formatNumber } from "@/lib/date";
import { navigate } from "@/lib/router";
import { ACHIEVEMENTS } from "@/lib/scoring";
import { recentActivity } from "@/lib/selectors";
import { useHunter } from "@/lib/store";
import type { AchievementDefinition } from "@/lib/scoring";
import type { MemberStats } from "@/lib/types";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Emblem,
  Eyebrow,
  Icon,
  MemberAvatar,
  Modal,
  Pill,
  ProgressBar,
  RingProgress,
  SectionHeader,
  Toggle,
  type IconName,
} from "@/components/ui";
import { ActivityFeed, ConsistencyPanel, LocalDataBadge } from "@/components/widgets";

type HistoryFilter = "all" | "mission" | "exercise" | "basics";

export function Profile() {
  const {
    state,
    activeMember,
    stats,
    setActiveMember,
    renameActiveMember,
    setCameraConsent,
    resetAll,
    downloadRecord,
  } = useHunter();
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [resetOpen, setResetOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(activeMember.name);
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    setNameDraft(activeMember.name);
  }, [activeMember.id, activeMember.name]);

  const history = useMemo(() => {
    const rows = recentActivity(state, activeMember.id, 40);
    if (historyFilter === "all") return rows;
    if (historyFilter === "mission") return rows.filter((entry) => entry.kind === "mission" || entry.kind === "recovery");
    if (historyFilter === "basics") return rows.filter((entry) => entry.kind === "basics");
    return rows.filter((entry) => entry.kind === "exercise" || entry.kind === "session");
  }, [state, activeMember.id, historyFilter]);

  const achievementRows = ACHIEVEMENTS.map((achievement) => ({
    definition: achievement,
    value: achievementValue(achievement, stats),
    unlocked: achievementValue(achievement, stats) >= achievement.threshold,
  }));
  const unlockedCount = achievementRows.filter((row) => row.unlocked).length;
  const seededCount = state.log.filter((entry) => entry.seed && entry.memberId === activeMember.id).length;
  const localCount = state.log.filter((entry) => !entry.seed && entry.memberId === activeMember.id).length;
  const nameChanged = nameDraft.trim() !== activeMember.name && nameDraft.trim().length > 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-fade flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            <Eyebrow className="text-gold/80">Hunter record</Eyebrow>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-muted/50 sm:inline">/ dossier &amp; ascent</span>
          </div>
          <h1 className="mt-1.5 font-display text-[24px] font-medium leading-tight text-[#f0ebdf] sm:text-[28px]">
            Hunter Dossier
          </h1>
          <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-muted">
            A private record of the ascent — lifetime XP, training volume, consistency, achievements and the honest local
            ledger behind it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalDataBadge />
          <Button variant="secondary" size="sm" icon="download" onClick={downloadRecord}>
            Export record
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Identity */}
        <Card className="hero-wash corner-brackets animate-rise relative overflow-hidden xl:col-span-8">
          <div className="pointer-events-none absolute -right-12 -top-10 text-gold/[0.06]">
            <Emblem size={260} />
          </div>
          <div className="relative p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative shrink-0 self-start">
                <MemberAvatar monogram={activeMember.monogram} name={activeMember.name} size={68} active rank={stats.rank} />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-[2px] border border-gold/35 bg-[#15130f] px-1.5 py-[1px] font-sans text-[7px] font-semibold uppercase tracking-[0.12em] text-gold">
                  Hunter
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <IdentityHeading stats={stats} />
                <p className="mt-1 text-[9.5px] uppercase tracking-[0.13em] text-muted/65">
                  {activeMember.handle} · initiated {activeMember.joined}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="gold" dot>Active record</Pill>
                  <Pill tone="dark">Local · not synced</Pill>
                  <Pill tone="neutral">Seeded demo history</Pill>
                </div>
                <p className="mt-3 max-w-lg border-l border-gold/25 pl-2.5 font-display text-[12px] italic leading-relaxed text-[#c8beac]">
                  “{stats.rank === "S" ? "The summit does not make the hunter." : "The ascent is measured in days kept, not moments of glory."}”
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <IdentityStat label="Lifetime XP" value={formatNumber(stats.totalXp)} />
                  <IdentityStat label="Missions" value={`${stats.completedMissions}`} />
                  <IdentityStat label="Exercise time" value={formatDuration(stats.totalSeconds)} />
                  <IdentityStat label="Streak" value={`${stats.streak}d`} accent />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-sans text-[8.5px] uppercase tracking-[0.11em] text-muted/60">Switch hunter record</span>
                {state.members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setActiveMember(member.id)}
                    aria-pressed={member.id === activeMember.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[3px] border px-2 py-1 font-sans text-[8.5px] uppercase tracking-[0.08em] transition-colors",
                      member.id === activeMember.id
                        ? "border-gold/40 bg-gold/10 text-[#ecd7b4]"
                        : "border-line bg-black/20 text-muted/75 hover:border-gold/25",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", member.id === activeMember.id ? "bg-orange" : "bg-muted/50")} />
                    {member.name}
                  </button>
                ))}
              </div>
              <span className="font-sans text-[8px] uppercase tracking-[0.12em] text-muted/50">{formatInvocation()} · Olympus</span>
            </div>
          </div>
        </Card>

        {/* Rank ascent */}
        <Card className="animate-rise overflow-hidden xl:col-span-4">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <SectionHeader icon="spark" title="Rank ascent" subtitle="Progression is earned, not assigned" />
            <Pill tone="gold" dot>
              {stats.rank}
            </Pill>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <RingProgress value={stats.levelProgress * 100} size={112} stroke={5} tone="gold">
                <span className="font-sans text-[7.5px] uppercase tracking-[0.14em] text-muted/80">Level</span>
                <span className="font-display text-[32px] leading-none text-[#f1e6d2]">{stats.level}</span>
                <span className="font-mono text-[8px] text-gold/70">{formatNumber(stats.totalXp)} XP</span>
              </RingProgress>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[17px] leading-tight text-[#ede3d1]">{rankTitle(stats.rank)}</p>
                <p className="mt-0.5 font-sans text-[8.5px] uppercase tracking-[0.11em] text-muted/65">Rank {stats.rank} · Class record</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[8.5px] text-muted/70">
                    <span>Next level</span>
                    <span className="font-mono text-gold/75">{formatNumber(stats.xpToNextLevel)} XP</span>
                  </div>
                  <ProgressBar value={stats.levelProgress * 100} tone="orange" height="h-1" className="mt-1" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[8.5px] text-muted/70">
                    <span>{stats.nextRank ? `Rank ${stats.nextRank}` : "Peak rank"}</span>
                    <span className="font-mono text-gold/75">
                      {stats.nextRankXp ? `${formatNumber(stats.nextRankXp - stats.totalXp)} XP away` : "Sovereign"}
                    </span>
                  </div>
                  <ProgressBar value={stats.rankProgress * 100} tone="gold" height="h-1" className="mt-1" />
                </div>
              </div>
            </div>
            <div className="mt-3.5 flex items-center justify-between gap-1">
              {(["E", "D", "C", "B", "A", "S"] as const).map((rank) => {
                const reached = ["E", "D", "C", "B", "A", "S"].indexOf(stats.rank) >= ["E", "D", "C", "B", "A", "S"].indexOf(rank);
                return (
                  <div key={rank} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full border font-display text-[9px]",
                        rank === stats.rank
                          ? "border-orange/60 bg-orange/15 text-orange"
                          : reached
                            ? "border-gold/35 bg-gold/[0.07] text-gold"
                            : "border-line bg-black/20 text-muted/45",
                      )}
                    >
                      {rank}
                    </span>
                    <span className={cn("h-px w-full", reached ? "bg-gold/20" : "bg-line/60")} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-[4px] border border-line bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[8.5px] uppercase tracking-[0.1em] text-muted/70">Achievements</span>
                <span className="font-mono text-[9px] text-gold/80">{unlockedCount}/{ACHIEVEMENTS.length}</span>
              </div>
              <ProgressBar value={(unlockedCount / ACHIEVEMENTS.length) * 100} tone="gold" height="h-1" className="mt-1.5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Telemetry */}
      <Card className="animate-rise overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-line/60 sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-6">
          <TelemetryTile icon="spark" label="Lifetime XP" value={formatNumber(stats.totalXp)} note={`${stats.totalLocalXp > 0 ? `+${formatNumber(stats.totalLocalXp)} local` : "Full record"}`} />
          <TelemetryTile icon="shield" label="Missions" value={`${stats.completedMissions}`} note={`${stats.localMissions} recorded here`} />
          <TelemetryTile icon="clock" label="Exercise time" value={formatDuration(stats.totalSeconds)} note="Recorded volume" />
          <TelemetryTile icon="flame" label="Current streak" value={`${stats.streak}`} note="Days unbroken" accent />
          <TelemetryTile icon="target" label="Weekly consistency" value={`${stats.weeklyConsistency}%`} note={`${stats.weeklyDays.filter(Boolean).length} of 7 days`} />
          <TelemetryTile icon="calendar" label="Monthly consistency" value={`${stats.monthlyConsistency}%`} note="Rolling 30 days" />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Achievements */}
        <Card className="animate-rise overflow-hidden xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
            <SectionHeader icon="trophy" title="Achievements" subtitle="Derived from the full record, including labelled demo history" />
            <Pill tone={unlockedCount === ACHIEVEMENTS.length ? "gold" : "dark"}>{unlockedCount} of {ACHIEVEMENTS.length} earned</Pill>
          </div>
          <div className="grid gap-2.5 p-3.5 sm:grid-cols-2">
            {achievementRows.map(({ definition, value, unlocked }) => (
              <AchievementCard key={definition.id} definition={definition} value={value} unlocked={unlocked} />
            ))}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-5">
          <Card className="animate-rise overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <SectionHeader icon="calendar" title="Consistency" subtitle="Weekly rhythm & rolling month" />
              <Pill tone="teal">{stats.streak}-day streak</Pill>
            </div>
            <div className="p-3.5">
              <ConsistencyPanel
                weeklyDays={stats.weeklyDays}
                weeklyPercent={stats.weeklyConsistency}
                monthlyPercent={stats.monthlyConsistency}
                todayIndex={todayIndex}
              />
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <TinyMetric label="Month" value={`${stats.monthlyConsistency}%`} />
                <TinyMetric label="Local basics" value={`${stats.localBasics}`} />
                <TinyMetric label="Local XP" value={formatNumber(stats.totalLocalXp)} />
              </div>
            </div>
          </Card>

          {/* Hunter settings */}
          <Card className="animate-rise overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <SectionHeader icon="settings" title="Identity & record" subtitle="Local-only controls" />
              <Pill tone="gold">Local</Pill>
            </div>
            <div className="space-y-3 p-3.5">
              <div>
                <label htmlFor="hunter-name" className="mb-1 block font-sans text-[8.5px] uppercase tracking-[0.11em] text-muted/70">
                  Display name
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="hunter-name"
                    className="field"
                    value={nameDraft}
                    maxLength={28}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder="Hunter name"
                  />
                  <Button
                    variant={nameChanged ? "gold" : "secondary"}
                    size="md"
                    disabled={!nameChanged}
                    onClick={() => renameActiveMember(nameDraft)}
                  >
                    Save
                  </Button>
                </div>
                <p className="mt-1 text-[8.5px] leading-relaxed text-muted/55">
                  Changing the name edits this local dossier only. Account identity belongs to Supabase authentication.
                </p>
              </div>

              <div className="rounded-[4px] border border-line bg-black/20 p-2.5">
                <Toggle
                  checked={state.cameraConsent}
                  onChange={setCameraConsent}
                  label="Permit private video proof (future release)"
                  description="Preference saved locally. No camera, recording or upload is active in this build."
                />
              </div>

              <div className="flex items-start gap-2 rounded-[4px] border border-line bg-black/20 px-2.5 py-2">
                <Icon name="database" size={12} className="mt-0.5 text-gold/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] text-[#d5d0c4]">Local &amp; seeded records</p>
                  <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted/60">
                    {localCount} local {localCount === 1 ? "action" : "actions"} · {seededCount} seeded demo {seededCount === 1 ? "entry" : "entries"}. Neither is synchronized.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("squad")}
                  className="shrink-0 font-sans text-[8px] font-semibold uppercase tracking-[0.08em] text-gold/80 hover:text-gold"
                >
                  Details
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" icon="download" onClick={downloadRecord}>
                  Export JSON
                </Button>
                <Button variant="danger" size="sm" icon="refresh" onClick={() => setResetOpen(true)}>
                  Reset local record
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Activity history */}
      <Card className="animate-rise overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3 sm:px-5">
          <SectionHeader icon="activity" title="Activity history" subtitle={`${activeMember.name}'s ledger · seeded demo and local records are labelled`} />
          <div className="flex flex-wrap items-center gap-1">
            {([
              ["all", "All"],
              ["mission", "Missions"],
              ["exercise", "Exercises"],
              ["basics", "Foundations"],
            ] as [HistoryFilter, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setHistoryFilter(id)}
                aria-pressed={historyFilter === id}
                className={cn(
                  "rounded-[3px] border px-2 py-1 font-sans text-[8.5px] font-semibold uppercase tracking-[0.09em] transition-colors",
                  historyFilter === id
                    ? "border-gold/40 bg-gold/10 text-[#e7d2ae]"
                    : "border-line bg-black/20 text-muted/75 hover:border-gold/25",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <ActivityFeed entries={history} members={state.members} max={16} showMember={false} />
        </div>
      </Card>

      <div className="animate-fade flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3.5">
        <p className="max-w-lg font-display text-[11px] italic leading-relaxed text-muted/60">
          “The record is not the reward. The record is the evidence of the life you chose.”
        </p>
        <span className="font-sans text-[8.5px] uppercase tracking-[0.16em] text-muted/45">
          Dossier · {activeMember.name} · {formatNumber(stats.totalXp)} XP
        </span>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset this local record?"
        eyebrow="Data management"
        width="max-w-md"
      >
        <p className="text-[12px] leading-relaxed text-muted">
          Every local action, check-off, timer preference and schedule edit on this browser will be removed. The seeded
          demo record will return, with both hunters' baseline totals. This does not touch any remote project and cannot
          be undone.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon="refresh"
            onClick={() => {
              resetAll();
              setResetOpen(false);
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function IdentityHeading({ stats }: { stats: MemberStats }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[28px] leading-none text-[#f4eddf] sm:text-[32px]">{stats.member.name}</h2>
        <Pill tone="gold">Rank {stats.rank}</Pill>
        <Pill tone="dark">Level {stats.level}</Pill>
      </div>
      <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.16em] text-gold/70">{stats.member.title}</p>
    </>
  );
}

function IdentityStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-[3px] border border-line/70 bg-black/20 px-2 py-1.5">
      <p className={cn("truncate font-mono text-[11px]", accent ? "text-[#f0c38f]" : "text-[#e2dacb]")}>{value}</p>
      <p className="mt-0.5 truncate font-sans text-[7.5px] uppercase tracking-[0.09em] text-muted/60">{label}</p>
    </div>
  );
}

function TelemetryTile({
  icon,
  label,
  value,
  note,
  accent = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 px-3.5 py-3.5">
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={11} className="text-gold/60" />
        <span className="truncate font-sans text-[8px] uppercase tracking-[0.12em] text-muted/70">{label}</span>
      </div>
      <p className={cn("mt-1.5 truncate font-display text-[20px] leading-none", accent ? "text-[#f0c794]" : "text-[#ece3d2]")}>{value}</p>
      <p className="mt-1 truncate font-sans text-[8px] uppercase tracking-[0.08em] text-muted/50">{note}</p>
    </div>
  );
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-line/70 bg-black/20 px-2 py-1.5 text-center">
      <p className="truncate font-mono text-[10px] text-[#dfd6c5]">{value}</p>
      <p className="mt-0.5 truncate font-sans text-[7.5px] uppercase tracking-[0.08em] text-muted/60">{label}</p>
    </div>
  );
}

function achievementValue(definition: AchievementDefinition, stats: MemberStats): number {
  switch (definition.metric) {
    case "streak":
      return stats.streak;
    case "totalXp":
      return stats.totalXp;
    case "missions":
      return stats.completedMissions;
    case "seconds":
      return stats.totalSeconds;
    case "localMissions":
      return stats.localMissions;
    case "localBasics":
      return stats.localBasics;
    case "weeklyConsistency":
      return stats.weeklyDays.filter(Boolean).length;
    default:
      return 0;
  }
}

function displayAchievementValue(definition: AchievementDefinition, value: number): string {
  if (definition.metric === "seconds") return formatDuration(value);
  if (definition.metric === "totalXp" || definition.metric === "missions") return formatNumber(Math.round(value));
  if (definition.metric === "weeklyConsistency") return `${Math.min(value, definition.threshold)}/${definition.threshold}`;
  return `${Math.min(value, definition.threshold)}/${definition.threshold}`;
}

function AchievementCard({
  definition,
  value,
  unlocked,
}: {
  definition: AchievementDefinition;
  value: number;
  unlocked: boolean;
}) {
  const progress = Math.min(100, (value / definition.threshold) * 100);
  const icon = (definition.icon || "laurel") as IconName;
  return (
    <div
      className={cn(
        "rounded-[4px] border p-2.5 transition-colors",
        unlocked
          ? "border-gold/30 bg-[linear-gradient(140deg,rgba(214,183,127,0.08),rgba(0,0,0,0.16))]"
          : "border-line/80 bg-black/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border",
            unlocked ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-white/[0.02] text-muted/45",
          )}
        >
          <Icon name={unlocked ? icon : "lock"} size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className={cn("truncate font-display text-[12.5px]", unlocked ? "text-[#efe2c9]" : "text-[#b9b5ac]")}>{definition.name}</p>
            {unlocked ? <Pill tone="gold" className="px-1.5 py-0 text-[7px]">Earned</Pill> : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-relaxed text-muted/65">{definition.description}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={progress} tone={unlocked ? "gold" : "muted"} height="h-[3px]" className="flex-1" />
            <span className="shrink-0 font-mono text-[7.5px] text-muted/60">{displayAchievementValue(definition, value)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function rankTitle(rank: string): string {
  const titles: Record<string, string> = {
    E: "Unawakened",
    D: "Bronze Aspirant",
    C: "Silver Hunter",
    B: "Gold Hunter",
    A: "Olympian",
    S: "Ascendant",
  };
  return titles[rank] ?? "Hunter";
}
