import { useState, type ReactNode } from "react";
import { formatInvocation } from "@/lib/date";
import { navigate, type Page, type Route } from "@/lib/router";
import { isSupabaseConfigured, SUPABASE_ENV_KEYS } from "@/lib/supabase";
import { useHunter } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Emblem,
  GreekKey,
  Icon,
  MemberAvatar,
  Modal,
  Pill,
  type IconName,
} from "./ui";

const NAV_ITEMS: { page: Page; label: string; icon: IconName }[] = [
  { page: "dashboard", label: "Dashboard", icon: "grid" },
  { page: "missions", label: "Missions", icon: "target" },
  { page: "squad", label: "Squad", icon: "users" },
  { page: "profile", label: "Dossier", icon: "user" },
];

const PAGE_SCOPE: Record<Page, string> = {
  dashboard: "Hunter Dashboard",
  missions: "Mission Command",
  squad: "Two-Hunter Chamber",
  profile: "Hunter Dossier",
  workout: "Workout Chamber",
};

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { state, activeMember, stats, todaySession, beginMission, toasts, dismissToast } = useHunter();
  const [syncOpen, setSyncOpen] = useState(false);

  const launchMission = () => {
    if (route.page === "workout") {
      const activeSession = route.param ?? state.activeWorkout.sessionId ?? todaySession?.id;
      if (activeSession) navigate(`workout/${activeSession}`);
      return;
    }
    if (!todaySession) {
      navigate("missions");
      return;
    }
    beginMission(todaySession.id);
    navigate(`workout/${todaySession.id}`);
  };

  const scope = PAGE_SCOPE[route.page];

  return (
    <div className="relative min-h-screen">
      <div className="shell-background" />
      <div className="shell-grid" />
      <div className="vertical-rule left-[max(16px,calc((100vw-1360px)/2))] hidden xl:block" />
      <div className="vertical-rule right-[max(16px,calc((100vw-1360px)/2))] hidden xl:block" />

      <header className="sticky top-0 z-40 border-b border-line/80 bg-[#090a0d]/88 backdrop-blur-xl">
        <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-9">
          <div className="flex h-[62px] items-center justify-between gap-3 lg:h-[74px]">
            <div className="flex min-w-0 items-center gap-3 lg:gap-6">
              <button
                type="button"
                onClick={() => navigate("dashboard")}
                className="group flex min-w-0 items-center gap-2.5 text-left"
                aria-label="Hunter Squad home"
              >
                <span className="relative grid h-9 w-9 place-items-center rounded-[4px] border border-gold/30 bg-[radial-gradient(circle_at_35%_20%,#2c2417,#0d0e11_70%)] text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:h-10 lg:w-10">
                  <Emblem size={27} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[13px] font-semibold leading-tight tracking-[0.075em] text-[#f1ebde] sm:text-[14px] lg:text-[15px]">
                    HUNTER SQUAD
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <span className="hidden truncate font-sans text-[8px] font-medium uppercase tracking-[0.28em] text-gold/70 sm:inline">
                      Olympus Ascendant
                    </span>
                    <span className="hidden h-2 w-px bg-line sm:block" />
                    <span className="truncate font-sans text-[8px] uppercase tracking-[0.18em] text-muted sm:hidden">
                      Olympus Ascendant
                    </span>
                  </span>
                </span>
              </button>

              <div className="hidden h-8 w-px bg-line/80 xl:block" />
              <span className="hidden whitespace-nowrap font-sans text-[10px] uppercase tracking-[0.18em] text-muted/85 xl:inline">
                {scope}
              </span>
            </div>

            <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = route.page === item.page;
                return (
                  <button
                    key={item.page}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => navigate(item.page)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-[3px] px-3 py-[9px] font-sans text-[10px] font-medium uppercase tracking-[0.13em] transition-colors",
                      isActive
                        ? "bg-white/[0.045] text-[#f2e8d5]"
                        : "text-muted hover:bg-white/[0.025] hover:text-[#dedbd2]",
                    )}
                  >
                    <Icon name={item.icon} size={13} className={isActive ? "text-gold" : "text-muted/75"} />
                    {item.label}
                    {item.page === "squad" ? <span className="text-[9px] text-muted/65">(2)</span> : null}
                    {isActive ? <span className="absolute inset-x-2 -bottom-[1px] h-px bg-gradient-to-r from-transparent via-orange/80 to-transparent" /> : null}
                  </button>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setSyncOpen(true)}
                className="hidden items-center gap-1.5 rounded-[3px] border border-line bg-black/20 px-2.5 py-[6px] font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-muted transition-colors hover:border-gold/30 hover:text-gold md:flex"
                title="Data source status"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                {isSupabaseConfigured ? "Supabase" : "Local demo"}
              </button>

              <div className="hidden items-center gap-2 rounded-[4px] border border-line bg-white/[0.02] py-1 pl-2 pr-2 sm:flex">
                <span className="grid h-[22px] w-[22px] place-items-center rounded-[2px] border border-gold/35 bg-gold/10 font-display text-[11px] text-gold">
                  {stats.rank}
                </span>
                <div className="leading-tight">
                  <p className="font-sans text-[8px] uppercase tracking-[0.14em] text-muted">Level</p>
                  <p className="font-mono text-[10px] font-medium text-[#e8e1d3]">{stats.level}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("profile")}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                aria-label={`Open ${activeMember.name}'s dossier`}
              >
                <MemberAvatar monogram={activeMember.monogram} name={activeMember.name} size={32} active rank={stats.rank} />
              </button>

              {route.page === "workout" ? (
                <Button variant="secondary" size="sm" icon="arrowLeft" onClick={() => navigate("dashboard")} className="hidden sm:inline-flex">
                  Exit
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon="play" onClick={launchMission} className="hidden sm:inline-flex">
                  Start Mission
                </Button>
              )}

              <button
                type="button"
                onClick={() => navigate("missions")}
                aria-label="Open mission command"
                className="grid h-9 w-9 place-items-center rounded-[4px] border border-line text-muted sm:hidden"
              >
                <Icon name="menu" size={17} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pb-2 lg:hidden">
            <span className="font-sans text-[8px] uppercase tracking-[0.2em] text-muted/75">{scope}</span>
            <span className="font-sans text-[8px] uppercase tracking-[0.14em] text-muted/60">{formatInvocation()}</span>
          </div>
        </div>
        <GreekKey className="absolute inset-x-0 -bottom-[1px] opacity-30" />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-9 lg:pb-14 lg:pt-8">
        {children}
      </main>

      <footer className="relative z-10 mx-auto hidden w-full max-w-[1400px] items-center justify-between gap-4 border-t border-line/70 px-9 py-5 lg:flex">
        <div className="flex items-center gap-2 text-muted/70">
          <Emblem size={17} />
          <span className="font-sans text-[9px] uppercase tracking-[0.2em]">Hunter Squad // Olympus Ascendant</span>
        </div>
        <p className="font-sans text-[9px] uppercase tracking-[0.15em] text-muted/55">
          Local demo ledger · not synchronized between hunters
        </p>
        <p className="font-sans text-[9px] uppercase tracking-[0.15em] text-muted/55">Consistency over mass</p>
      </footer>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/90 bg-[#0a0b0e]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-1 pb-1.5 pt-1.5">
          {[
            { page: "dashboard" as Page, label: "Home", icon: "grid" as IconName },
            { page: "missions" as Page, label: "Missions", icon: "target" as IconName },
          ].map((item) => (
            <MobileTab key={item.page} item={item} active={route.page === item.page} />
          ))}
          <button
            type="button"
            onClick={launchMission}
            className="relative -mt-5 flex flex-col items-center gap-0.5"
            aria-label="Start today's mission"
          >
            <span
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full border text-[#1d1207] shadow-[0_8px_24px_-6px_rgba(240,150,47,0.6)]",
                route.page === "workout"
                  ? "border-[#ffc078] bg-[#c47119]"
                  : "border-[#ffba6b] bg-[linear-gradient(180deg,#f8a745,#dc7c1b)]",
              )}
            >
              <Icon name={route.page === "workout" ? "timer" : "play"} size={19} />
            </span>
            <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.12em] text-[#e6b77c]">Train</span>
          </button>
          {[
            { page: "squad" as Page, label: "Squad", icon: "users" as IconName },
            { page: "profile" as Page, label: "Dossier", icon: "user" as IconName },
          ].map((item) => (
            <MobileTab key={item.page} item={item} active={route.page === item.page} />
          ))}
        </div>
      </nav>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6 lg:bottom-6">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={cn(
              "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[5px] border bg-[#14161b]/97 px-3.5 py-3 text-left shadow-[0_18px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl",
              toast.tone === "success" ? "border-teal/35" : toast.tone === "warning" ? "border-danger/35" : "border-gold/35",
            )}
          >
            <span
              className={cn(
                "mt-0.5",
                toast.tone === "success" ? "text-teal" : toast.tone === "warning" ? "text-danger" : "text-gold",
              )}
            >
              <Icon name={toast.tone === "success" ? "check" : toast.tone === "warning" ? "warning" : "spark"} size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-medium leading-snug text-[#eee8db]">{toast.title}</span>
              {toast.detail ? <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{toast.detail}</span> : null}
            </span>
            <Icon name="x" size={12} className="ml-auto mt-0.5 shrink-0 text-muted/60" />
          </button>
        ))}
      </div>

      <Modal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        title="Data source & synchronization"
        eyebrow="System integrity"
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="database" size={16} className="text-gold" />
                <p className="font-display text-[15px] text-parchment">Local demo mode</p>
              </div>
              <Pill tone="gold" dot>
                Active
              </Pill>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Your completions, XP, streak and edits are saved in this browser's localStorage through one data layer.
              They survive refreshes on this device. They are <span className="text-[#e4cd9f]">not</span> shared with the
              second hunter, and there is no simulated sync in this build.
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="cloud" size={16} className="text-teal" />
                <p className="font-display text-[15px] text-parchment">Supabase gateway</p>
              </div>
              <Pill tone={isSupabaseConfigured ? "teal" : "neutral"} dot>
                {isSupabaseConfigured ? "Configured" : "Not connected"}
              </Pill>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              The remote boundary is prepared in <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-gold">src/lib/supabase.ts</code>.
              Add your project URL and anon key at build time, then apply the schema and Row Level Security policies in the
              README. Never place a service-role key in frontend code.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[4px] border border-line bg-black/30 px-3 py-2">
                <p className="font-mono text-[10px] text-gold/90">{SUPABASE_ENV_KEYS.url}</p>
                <p className="mt-0.5 text-[10px] text-muted">Project URL</p>
              </div>
              <div className="rounded-[4px] border border-line bg-black/30 px-3 py-2">
                <p className="font-mono text-[10px] text-gold/90">{SUPABASE_ENV_KEYS.anonKey}</p>
                <p className="mt-0.5 text-[10px] text-muted">Anon / publishable key only</p>
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSyncOpen(false)}>
              Close
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon="users"
              onClick={() => {
                setSyncOpen(false);
                navigate("squad");
              }}
            >
              Open squad chamber
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MobileTab({
  item,
  active,
}: {
  item: { page: Page; label: string; icon: IconName };
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => navigate(item.page)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-[4px] transition-colors",
        active ? "text-gold" : "text-muted",
      )}
    >
      <Icon name={item.icon} size={18} strokeWidth={active ? 1.9 : 1.6} />
      <span className="font-sans text-[9px] font-medium uppercase tracking-[0.08em]">{item.label}</span>
      <span className={cn("h-[2px] w-4 rounded-full", active ? "bg-orange" : "bg-transparent")} />
    </button>
  );
}
