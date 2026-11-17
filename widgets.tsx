import { DAY_LABELS, formatRelativeTime } from "@/lib/date";
import type { ActivityEntry, MemberSeed } from "@/lib/types";
import { cn } from "@/utils/cn";
import { Card, Eyebrow, Icon, MemberAvatar, Pill, type IconName } from "./ui";

export function LocalDataBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border border-gold/25 bg-gold/[0.06] px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-gold/85",
        className,
      )}
      title="Stored only in this browser. Not synchronized."
    >
      <Icon name="database" size={11} />
      {compact ? "Local" : "Local demo record"}
      <span className="text-gold/40">·</span>
      <span className="text-muted">Not synced</span>
    </span>
  );
}

export function StreakDots({
  days,
  compact = false,
  showLabels = true,
  todayIndex,
}: {
  days: boolean[];
  compact?: boolean;
  showLabels?: boolean;
  todayIndex?: number;
}) {
  return (
    <div className={cn("flex items-end", compact ? "gap-1" : "gap-1.5 sm:gap-2")} role="img" aria-label="Weekly mission completion">
      {days.map((done, index) => {
        const isToday = todayIndex === index;
        return (
          <div key={`${DAY_LABELS[index]}-${index}`} className="flex min-w-0 flex-col items-center gap-1">
            <span
              className={cn(
                "grid place-items-center rounded-[3px] border transition-colors",
                compact ? "h-[19px] w-[19px]" : "h-[25px] w-[25px] sm:h-[27px] sm:w-[27px]",
                done
                  ? "border-teal/45 bg-[linear-gradient(180deg,rgba(125,182,166,0.28),rgba(125,182,166,0.1))] text-[#c4e3d9]"
                  : "border-line bg-black/30 text-muted/40",
                isToday && !done && "border-gold/55 text-gold/70",
                isToday && "ring-1 ring-orange/30 ring-offset-1 ring-offset-panel",
              )}
            >
              {done ? (
                <Icon name="check" size={compact ? 9 : 11} strokeWidth={2.4} />
              ) : (
                <span className={cn("rounded-full bg-current", compact ? "h-1 w-1" : "h-1 w-1")} />
              )}
            </span>
            {showLabels ? (
              <span className={cn("font-sans text-[8px] uppercase tracking-[0.08em]", isToday ? "text-orange/90" : "text-muted/65")}>
                {DAY_LABELS[index]?.charAt(0)}
                <span className="hidden sm:inline">{DAY_LABELS[index]?.slice(1).toLowerCase()}</span>
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const KIND_ICONS: Record<ActivityEntry["kind"], IconName> = {
  mission: "shield",
  exercise: "dumbbell",
  session: "timer",
  basics: "leaf",
  recovery: "sun",
  achievement: "trophy",
};

export function ActivityFeed({
  entries,
  members,
  emptyText = "No local activity recorded yet. Complete an exercise to begin the ledger.",
  showMember = true,
  max = 6,
  className,
}: {
  entries: ActivityEntry[];
  members: MemberSeed[];
  emptyText?: string;
  showMember?: boolean;
  max?: number;
  className?: string;
}) {
  const visible = entries.slice(0, max);
  if (!visible.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-[4px] border border-dashed border-line bg-black/20 px-5 py-8 text-center", className)}>
        <Icon name="activity" size={20} className="mb-2 text-gold/45" />
        <p className="text-[11px] leading-relaxed text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-line/65", className)}>
      {visible.map((entry) => {
        const member = members.find((item) => item.id === entry.memberId) ?? members[0];
        return (
          <li key={entry.id} className="flex items-start gap-2.5 px-0 py-2.5 first:pt-0 last:pb-0">
            {showMember ? (
              <MemberAvatar monogram={member?.monogram ?? "HS"} name={member?.name} size={28} active={member?.id === entry.memberId} />
            ) : (
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white/[0.03] text-gold/80">
                <Icon name={KIND_ICONS[entry.kind]} size={13} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[11.5px] font-medium leading-snug text-[#e4e0d6]">
                  {showMember ? `${member?.name} · ` : ""}
                  {entry.title}
                </p>
                <span className={cn("shrink-0 font-mono text-[10px] font-medium tabular", entry.xp > 0 ? "text-gold/90" : "text-muted/60")}>
                  {entry.xp > 0 ? `+${entry.xp} XP` : "—"}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed text-muted/85">{entry.detail}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 font-sans text-[8px] uppercase tracking-[0.1em]">
                <span className="text-muted/60">{formatRelativeTime(entry.at)}</span>
                <span className="text-line-bright">/</span>
                {entry.seed ? (
                  <span className="text-[#a99672]">Seeded demo history</span>
                ) : (
                  <span className="text-teal/80">Local record</span>
                )}
                {entry.seconds > 0 ? (
                  <>
                    <span className="text-line-bright">/</span>
                    <span className="text-muted/65">{Math.round(entry.seconds / 60)} min volume</span>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ConsistencyPanel({
  weeklyDays,
  weeklyPercent,
  monthlyPercent,
  todayIndex,
  compact = false,
}: {
  weeklyDays: boolean[];
  weeklyPercent: number;
  monthlyPercent: number;
  todayIndex?: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-[4px] border border-line bg-black/20", compact ? "p-3" : "p-3.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>Weekly consistency</Eyebrow>
        <span className="font-mono text-[10px] text-gold/90">
          {weeklyDays.filter(Boolean).length} / 7 days
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <StreakDots days={weeklyDays} todayIndex={todayIndex} compact={compact} />
        <span className="shrink-0 font-display text-[17px] text-[#ece1cc]">{weeklyPercent}%</span>
      </div>
      {!compact ? (
        <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
          <span className="text-[9.5px] uppercase tracking-[0.1em] text-muted/75">30-day consistency</span>
          <span className="font-mono text-[10px] text-[#c9b993]">{monthlyPercent}%</span>
        </div>
      ) : null}
    </div>
  );
}

export function SyncStatusCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="panel-sheen overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
        <div>
          <Eyebrow className="text-gold/70">Synchronization</Eyebrow>
          <p className="mt-1 font-display text-[15px] text-parchment">One covenant · two records</p>
        </div>
        <Pill tone="gold" dot>
          Local
        </Pill>
      </div>
      <div className={cn("space-y-3 px-4 py-3.5", compact && "space-y-2")}>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <Icon name="database" size={13} className="text-gold/70" />
          <span>Stored locally on this browser</span>
          <Icon name="check" size={11} className="ml-auto text-teal/80" />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <Icon name="cloud" size={13} className="text-muted/60" />
          <span>Supabase sync</span>
          <span className="ml-auto font-sans text-[8px] uppercase tracking-[0.12em] text-muted/60">Not connected</span>
        </div>
        <div className="h-px bg-line/70" />
        <p className="text-[10px] leading-relaxed text-muted/80">
          Seeded demo totals are marked. Real actions appear as local records. No data is shared between the two hunters
          until the Supabase schema and RLS policies are applied.
        </p>
      </div>
    </Card>
  );
}
