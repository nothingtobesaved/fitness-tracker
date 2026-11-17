import { useMemo, useState } from "react";
import { formatDuration, formatNumber } from "@/lib/date";
import { navigate } from "@/lib/router";
import { leaderboard, recentActivity } from "@/lib/selectors";
import { useHunter } from "@/lib/store";
import { isSupabaseConfigured, SQUAD_TABLES, SUPABASE_ENV_KEYS } from "@/lib/supabase";
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
  SectionHeader,
} from "@/components/ui";
import { ActivityFeed, LocalDataBadge, StreakDots } from "@/components/widgets";

const SYNC_ITEMS = [
  { label: "Authentication", detail: "Two member accounts", icon: "key" as const },
  { label: "Member profiles", detail: "Rank, level, XP and streak", icon: "user" as const },
  { label: "Missions & exercises", detail: "Shared protocols, per-set records", icon: "dumbbell" as const },
  { label: "Daily check-ins", detail: "One honest mission mark per day", icon: "calendar" as const },
  { label: "XP & leaderboard", detail: "Server-authoritative ledger", icon: "trophy" as const },
  { label: "Shared activity", detail: "Squad feed with member attribution", icon: "activity" as const },
];

export function Squad() {
  const { state, activeMember, stats, squadStats, setActiveMember, notify } = useHunter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [feedMember, setFeedMember] = useState<"all" | string>("all");
  const board = useMemo(() => leaderboard(state), [state]);
  const maxWeekly = Math.max(...board.map((entry) => entry.weeklyXp), 1);
  const leader = board[0];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const feed = useMemo(
    () => recentActivity(state, feedMember === "all" ? undefined : feedMember, 10),
    [state, feedMember],
  );
  const current = squadStats.find((entry) => entry.member.id === activeMember.id) ?? stats;
  const alkais = squadStats.find((entry) => entry.member.id === "alkais") ?? squadStats[0];
  const nikos = squadStats.find((entry) => entry.member.id === "nikos") ?? squadStats[1];
  const tandem = Math.min(alkais?.weeklyConsistency ?? 0, nikos?.weeklyConsistency ?? 0);

  const copyConfig = async () => {
    const snippet = `${SUPABASE_ENV_KEYS.url}=https://your-project.supabase.co\n${SUPABASE_ENV_KEYS.anonKey}=your-anon-publishable-key`;
    try {
      await navigator.clipboard.writeText(snippet);
      notify("Configuration names copied", "Only the anon/publishable key belongs in a frontend build.");
    } catch {
      notify("Copy unavailable", `Use ${SUPABASE_ENV_KEYS.url} and ${SUPABASE_ENV_KEYS.anonKey} from the README.`, "warning");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="animate-fade flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-gold/60" />
            <Eyebrow className="text-gold/80">The covenant</Eyebrow>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-muted/50 sm:inline">/ exactly two hunters</span>
          </div>
          <h1 className="mt-1.5 font-display text-[24px] font-medium leading-tight text-[#f0ebdf] sm:text-[28px]">
            Two-Hunter Squad Chamber
          </h1>
          <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-muted">
            Two hunters walking separately, bound by one standard. Weekly rank, completed missions and consistency — with
            the data source stated plainly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalDataBadge />
          <Button variant="secondary" size="sm" icon="database" onClick={() => setGuideOpen(true)}>
            Data source
          </Button>
        </div>
      </div>

      <div className="animate-rise flex flex-col gap-2.5 rounded-[5px] border border-gold/20 bg-[linear-gradient(100deg,rgba(214,183,127,0.07),rgba(0,0,0,0.16))] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-gold/80">
            <Icon name="info" size={15} />
          </span>
          <div>
            <p className="font-display text-[13px] text-[#e9dfcb]">Local demo data is labelled. Synchronized data is not active.</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted/85">
              Seeded totals help you test the interface. Your own check-offs are separate local records on this browser.
              Nothing here is shared with the second hunter — there is no simulated two-way sync.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Pill tone="gold" dot>
            Demo seed
          </Pill>
          <Pill tone="dark">No sync</Pill>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {squadStats.map((entry) => (
          <HunterCard
            key={entry.member.id}
            entry={entry}
            active={entry.member.id === activeMember.id}
            leader={entry.member.id === leader?.member.id}
            todayIndex={todayIndex}
            onOpen={() => {
              setActiveMember(entry.member.id);
              navigate("profile");
            }}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="animate-rise overflow-hidden xl:col-span-5">
          <div className="flex items-start justify-between gap-2 border-b border-line/70 px-4 py-3">
            <SectionHeader icon="trophy" title="Weekly leaderboard" subtitle="Derived from this week's local & seeded XP" />
            <Pill tone="gold" dot>
              This week
            </Pill>
          </div>
          <div className="p-3.5">
            {board.map((entry, index) => (
              <div
                key={entry.member.id}
                className={cn(
                  "mb-2 rounded-[4px] border p-3 last:mb-0",
                  index === 0 ? "border-gold/30 bg-gold/[0.05]" : "border-line/80 bg-black/20",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[17px] text-gold/70">{String(index + 1).padStart(2, "0")}</span>
                  <MemberAvatar monogram={entry.member.monogram} size={32} active={index === 0} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-display text-[14px] text-[#ede5d6]">{entry.member.name}</p>
                      {index === 0 ? <Icon name="crown" size={12} className="text-gold" /> : null}
                      {entry.member.id === activeMember.id ? <Pill tone="gold" className="px-1.5 py-0 text-[7px]">You</Pill> : null}
                    </div>
                    <p className="font-sans text-[8px] uppercase tracking-[0.12em] text-muted/70">
                      Rank {entry.rank} · Level {entry.level} · {entry.streak}-day streak
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[12px] text-[#eee1c8]">{formatNumber(entry.weeklyXp)}</p>
                    <p className="font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/60">weekly XP</p>
                  </div>
                </div>
                <ProgressBar value={(entry.weeklyXp / maxWeekly) * 100} tone={index === 0 ? "gold" : "muted"} height="h-1" className="mt-2.5" />
                <div className="mt-1 flex items-center justify-between font-sans text-[8px] uppercase tracking-[0.08em] text-muted/60">
                  <span>{entry.completedMissions} missions · {formatDuration(entry.totalSeconds)}</span>
                  <span className="text-[#b9a681]">
                    {index === 0 ? "Squad leader" : `${formatNumber(Math.max(0, leader.weeklyXp - entry.weeklyXp))} XP behind`}
                  </span>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-start gap-2 rounded-[4px] border border-line/70 bg-black/20 px-3 py-2">
              <Icon name="shield" size={12} className="mt-0.5 text-gold/65" />
              <p className="text-[9px] leading-relaxed text-muted/75">
                The leaderboard does not invent server data. Seeded demo weekly XP plus your local actions are summed;
                a Supabase deployment will replace this with RLS-protected ledger rows.
              </p>
            </div>
          </div>
        </Card>

        <Card className="animate-rise overflow-hidden xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
            <SectionHeader icon="activity" title="Recent activity" subtitle="Shared feed reference · local & seeded rows" />
            <div className="flex flex-wrap items-center gap-1">
              {(["all", ...state.members.map((member) => member.id)] as const).map((id) => {
                const member = state.members.find((item) => item.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFeedMember(id)}
                    aria-pressed={feedMember === id}
                    className={cn(
                      "rounded-[3px] border px-2 py-1 font-sans text-[8px] font-semibold uppercase tracking-[0.09em] transition-colors",
                      feedMember === id
                        ? "border-gold/40 bg-gold/10 text-[#e7d2ae]"
                        : "border-line bg-black/20 text-muted/75 hover:border-gold/25",
                    )}
                  >
                    {id === "all" ? "All" : member?.name ?? id}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4">
            <ActivityFeed entries={feed} members={state.members} max={8} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="animate-rise overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <SectionHeader icon="target" title="Squad consistency milestones" subtitle="Derived from both local records" />
            <Pill tone="dark">Reference</Pill>
          </div>
          <div className="grid gap-2.5 p-3.5 sm:grid-cols-3">
            <Milestone
              icon="users"
              title="Twin discipline"
              note="Both hunters hold at least half the week."
              value={tandem}
              target={50}
            />
            <Milestone
              icon="flame"
              title="Shared fire"
              note="The shorter active streak reaches 14 days."
              value={Math.min(alkais?.streak ?? 0, nikos?.streak ?? 0)}
              target={14}
              suffix="d"
            />
            <Milestone
              icon="shield"
              title="The long road"
              note="Combined 30-day consistency reaches 50%."
              value={Math.round(((alkais?.monthlyConsistency ?? 0) + (nikos?.monthlyConsistency ?? 0)) / 2)}
              target={50}
            />
          </div>
          <div className="border-t border-line/70 px-4 py-2.5">
            <p className="text-[9px] leading-relaxed text-muted/60">
              Milestones are visual references only; no XP is fabricated or awarded for them. Shared rewards will require
              server-side validation when Supabase is connected.
            </p>
          </div>
        </Card>

        <Card className="animate-rise overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <SectionHeader icon="database" title="Synchronization readiness" subtitle="Prepared, not pretended" />
            <Pill tone={isSupabaseConfigured ? "teal" : "gold"} dot>
              {isSupabaseConfigured ? "Configured" : "Not connected"}
            </Pill>
          </div>
          <div className="divide-y divide-line/60 px-4">
            {SYNC_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 py-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border border-line bg-black/20 text-gold/70">
                  <Icon name={item.icon} size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] text-[#d8d3c8]">{item.label}</p>
                  <p className="truncate text-[8.5px] text-muted/65">{item.detail}</p>
                </div>
                <span className="shrink-0 font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/50">Prepared</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
          <div className="border-t border-line/70 p-3.5">
            <Button variant="gold" size="sm" full icon="info" onClick={() => setGuideOpen(true)}>
              Open integration guide
            </Button>
            <p className="mt-2 text-center text-[8.5px] uppercase tracking-[0.1em] text-muted/50">
              {SQUAD_TABLES.profiles} · {SQUAD_TABLES.activity} · private storage
            </p>
          </div>
        </Card>
      </div>

      <div className="animate-fade flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3.5">
        <p className="max-w-xl font-display text-[11px] italic leading-relaxed text-muted/60">
          “Two hunters, one standard. The covenant is not a leaderboard; it is the refusal to train carelessly.”
        </p>
        <div className="flex items-center gap-2">
          <span className="font-sans text-[8px] uppercase tracking-[0.14em] text-muted/55">Current record: {current.member.name}</span>
          <Emblem size={16} className="text-gold/50" />
        </div>
      </div>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Connect your Supabase project"
        eyebrow="Integration guide"
        width="max-w-2xl"
      >
        <div className="space-y-3.5">
          <div className="rounded-[4px] border border-line bg-black/25 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[11px] text-[#ddd6c8]">
                <Icon name="database" size={13} className="text-gold" /> Current data source
              </span>
              <Pill tone="gold" dot>Local demo</Pill>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              The UI and all actions are complete in local mode. The remote gateway in{" "}
              <code className="rounded bg-black/40 px-1 text-[9.5px] text-gold">src/lib/supabase.ts</code> is not active
              until you configure a project.
            </p>
          </div>

          <ol className="space-y-2.5">
            {[
              ["Create the project", "Create a Supabase project and enable email authentication for exactly two hunters."],
              ["Apply the SQL", "Run the schema and Row Level Security policies listed in the repository README."],
              ["Add build-time keys", "Provide the project URL and anon/publishable key to the static build. Never use a service-role key."],
              ["Create two accounts", "Sign both hunters up, create the squad, and add both user IDs to squad_members."],
              ["Store proof privately", "Create a private Storage bucket for optional video proof, gated by explicit consent and RLS."],
            ].map(([title, copy], index) => (
              <li key={title} className="flex gap-2.5 rounded-[4px] border border-line/80 bg-black/20 p-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/[0.07] font-mono text-[9px] text-gold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[11px] font-medium text-[#ded8ca]">{title}</p>
                  <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted/80">{copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-[4px] border border-line bg-[#0a0b0e] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[8px] uppercase tracking-[0.12em] text-muted/70">Environment names</span>
              <button type="button" onClick={copyConfig} className="flex items-center gap-1 font-sans text-[8px] font-semibold uppercase tracking-[0.1em] text-gold/80 hover:text-gold">
                <Icon name="copy" size={10} /> Copy
              </button>
            </div>
            <pre className="mt-1.5 overflow-x-auto font-mono text-[9.5px] leading-relaxed text-[#bdad8e]">{`${SUPABASE_ENV_KEYS.url}=...
${SUPABASE_ENV_KEYS.anonKey}=...`}</pre>
          </div>

          <div className="flex items-start gap-2 rounded-[4px] border border-danger/25 bg-danger/[0.05] px-3 py-2">
            <Icon name="lock" size={12} className="mt-0.5 text-danger" />
            <p className="text-[9.5px] leading-relaxed text-[#d7b3a9]">
              Never expose a service-role key. Enable RLS on every table, restrict rows to the two squad members, and keep
              video proof out of public buckets. The anon key is safe only when policies are correctly configured.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setGuideOpen(false)}>
              Close guide
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function HunterCard({
  entry,
  active,
  leader,
  todayIndex,
  onOpen,
}: {
  entry: MemberStats;
  active: boolean;
  leader: boolean;
  todayIndex: number;
  onOpen: () => void;
}) {
  return (
    <Card
      className={cn(
        "animate-rise relative overflow-hidden",
        active ? "border-gold/30" : "border-line",
        leader && "shadow-[0_20px_60px_-40px_rgba(214,183,127,0.5)]",
      )}
    >
      {active ? <div className="h-[2px] w-full bg-[linear-gradient(90deg,#9d7844,#d6b77f,#f0962f,#9d7844)]" /> : null}
      <div className="pointer-events-none absolute -right-8 -top-5 text-gold/[0.05]">
        <Emblem size={160} />
      </div>
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MemberAvatar monogram={entry.member.monogram} name={entry.member.name} size={46} active={active} rank={entry.rank} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate font-display text-[21px] leading-tight text-[#f0e8d8]">{entry.member.name}</h2>
                {leader ? <Icon name="crown" size={14} className="text-gold" /> : null}
              </div>
              <p className="truncate font-sans text-[9px] uppercase tracking-[0.13em] text-muted/75">
                {entry.member.handle} · {entry.member.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Pill tone={active ? "gold" : "dark"} dot={active}>
                  {active ? "Your record" : "Demo ally"}
                </Pill>
                <Pill tone="neutral">Seeded history</Pill>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-2 rounded-[4px] border border-line bg-black/25 px-2 py-1">
              <div>
                <p className="font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/60">Rank</p>
                <p className="font-display text-[16px] leading-tight text-gold">{entry.rank}</p>
              </div>
              <span className="h-6 w-px bg-line" />
              <div>
                <p className="font-sans text-[7.5px] uppercase tracking-[0.1em] text-muted/60">Level</p>
                <p className="font-mono text-[13px] leading-tight text-[#ece1cd]">{entry.level}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <SquadStat label="Weekly XP" value={formatNumber(entry.weeklyXp)} accent />
          <SquadStat label="Exercise time" value={formatDuration(entry.totalSeconds)} />
          <SquadStat label="Completed missions" value={`${entry.completedMissions}`} />
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[4px] border border-line bg-black/20 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[8.5px] uppercase tracking-[0.11em] text-muted/70">Current streak</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-[#f0c38f]">
                <Icon name="flame" size={11} /> {entry.streak} days
              </span>
            </div>
            <p className="mt-1 text-[8.5px] leading-relaxed text-muted/60">
              {entry.streak >= 7 ? "The chain holds. Guard the next day." : "Every record starts with one honest day."}
            </p>
          </div>
          <div className="rounded-[4px] border border-line bg-black/20 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[8.5px] uppercase tracking-[0.11em] text-muted/70">Weekly consistency</span>
              <span className="font-mono text-[10px] text-gold/85">{entry.weeklyConsistency}%</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <StreakDots days={entry.weeklyDays} compact todayIndex={todayIndex} />
              <span className="font-mono text-[8px] text-muted/55">{entry.weeklyDays.filter(Boolean).length}/7</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={entry.rankProgress * 100} tone={active ? "gold" : "muted"} height="h-1" className="flex-1" />
          <span className="shrink-0 font-mono text-[8px] text-muted/60">
            {entry.nextRank ? `${entry.nextRank}-rank next` : "Peak rank"}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-sans text-[8px] uppercase tracking-[0.1em] text-muted/55">
            <Icon name="database" size={10} /> Local profile · not synced
          </span>
          <Button variant={active ? "gold" : "secondary"} size="sm" trailingIcon="arrowUpRight" onClick={onOpen}>
            {active ? "Open dossier" : "View record"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SquadStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-[3px] border border-line/70 bg-black/20 px-2 py-1.5">
      <p className={cn("truncate font-mono text-[11px]", accent ? "text-[#e8d2a9]" : "text-[#ddd5c6]")}>{value}</p>
      <p className="mt-0.5 truncate font-sans text-[7.5px] uppercase tracking-[0.08em] text-muted/65">{label}</p>
    </div>
  );
}

function Milestone({
  icon,
  title,
  note,
  value,
  target,
  suffix = "%",
}: {
  icon: "users" | "flame" | "shield";
  title: string;
  note: string;
  value: number;
  target: number;
  suffix?: string;
}) {
  const unlocked = value >= target;
  return (
    <div className={cn("rounded-[4px] border p-3", unlocked ? "border-teal/25 bg-teal/[0.05]" : "border-line/80 bg-black/20")}>
      <div className="flex items-center justify-between">
        <span className={cn("grid h-7 w-7 place-items-center rounded-full border", unlocked ? "border-teal/35 bg-teal/10 text-teal" : "border-gold/20 bg-gold/[0.05] text-gold/70")}>
          <Icon name={unlocked ? "check" : icon} size={13} />
        </span>
        <span className="font-mono text-[9px] text-muted/65">{Math.min(value, target)}{suffix} / {target}{suffix}</span>
      </div>
      <p className="mt-2 font-display text-[13px] text-[#e8e0d0]">{title}</p>
      <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted/70">{note}</p>
      <ProgressBar value={(value / target) * 100} tone={unlocked ? "teal" : "gold"} height="h-1" className="mt-2" />
    </div>
  );
}
