import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type IconName =
  | "grid"
  | "target"
  | "users"
  | "user"
  | "play"
  | "pause"
  | "check"
  | "x"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "arrowRight"
  | "arrowLeft"
  | "arrowUpRight"
  | "plus"
  | "minus"
  | "trash"
  | "edit"
  | "clock"
  | "flame"
  | "spark"
  | "trophy"
  | "camera"
  | "refresh"
  | "download"
  | "lock"
  | "info"
  | "timer"
  | "dumbbell"
  | "walk"
  | "leaf"
  | "laurel"
  | "shoulder"
  | "hip"
  | "ankle"
  | "calendar"
  | "crown"
  | "shield"
  | "sword"
  | "bolt"
  | "activity"
  | "film"
  | "settings"
  | "sun"
  | "warning"
  | "copy"
  | "filter"
  | "star"
  | "key"
  | "sync"
  | "menu"
  | "cloud"
  | "database"
  | "eye"
  | "expand";

const ICON_PATHS: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.5-5.4 5.5-5.4s5.5 2.2 5.5 5.4" />
      <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.9M17.2 14.9c2 .5 3.3 2.2 3.3 4.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.2c.4-3.7 3.3-5.9 7.2-5.9s6.8 2.2 7.2 5.9" />
    </>
  ),
  play: <path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="7" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="m4.5 12.5 4.7 4.7L19.5 6.9" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m14.5 5.5-7 6.5 7 6.5" />,
  chevronRight: <path d="m9.5 5.5 7 6.5-7 6.5" />,
  chevronDown: <path d="m5.5 9 6.5 7 6.5-7" />,
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowLeft: <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 13h9.2l.9-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4.3L20 8.3 15.7 4 4 15.7V20Z" />
      <path d="m13.5 6.2 4.3 4.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  flame: <path d="M12 21c4 0 6.7-2.6 6.7-6.2 0-3-1.8-5.5-4.4-7.5 0 2.2-1 3.5-2 3.5-.8 0-1.4-.7-1.4-2.2C8.7 10.2 5.3 12.6 5.3 15c0 3.5 2.6 6 6.7 6Z" />,
  spark: <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" />,
  trophy: (
    <>
      <path d="M8 4.5h8v4.8a4 4 0 0 1-8 0V4.5Z" />
      <path d="M8 6H4.8v1.6A3.4 3.4 0 0 0 8 11M16 6h3.2v1.6A3.4 3.4 0 0 1 16 11M12 13.4V18M8.5 20.5h7" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.6-2.3h7.8l1.6 2.3h3v11h-17v-11Z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.4 5.8" />
      <path d="M20 4.5V11h-6.5" />
    </>
  ),
  download: <path d="M12 3.5v11.8M7.5 11l4.5 4.5 4.5-4.5M4.5 20h15" />,
  lock: (
    <>
      <rect x="4.7" y="10" width="14.6" height="10.5" rx="2" />
      <path d="M8 10V7.7a4 4 0 0 1 8 0V10M12 14v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.2" r="7.4" />
      <path d="M12 9.4v3.8l2.4 1.5M9.5 3h5M12 3v2.8M18.8 6.6l1.4-1.4" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3 9.5v5M6.5 7.5v9M17.5 7.5v9M21 9.5v5M6.5 12h11" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.6" r="1.8" />
      <path d="m12.5 8.5-2.3 5.3 3.1 2.4-2 4.3M12.5 8.5l3 2.3 2.8.5M10.2 13.8l-3.7 2M13.3 16.2l3.6 1.6" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4c-8.5.3-14.5 3.9-14.5 9.4A5.6 5.6 0 0 0 11.2 19C16.9 19 19.7 12.5 20 4Z" />
      <path d="M4 21c1.2-5.6 5-9.5 10.4-11.8" />
    </>
  ),
  laurel: (
    <>
      <path d="M5 19c-.8-5 .8-9.8 5-13M19 19c.8-5-.8-9.8-5-13M12 5V3.6" />
      <path d="M9 7.5c-1.8 0-3.2-.9-4-2.2 1.9-.7 3.5-.2 4.6 1.1M7.6 11.2c-1.7-.4-2.8-1.4-3.3-2.9 2-.3 3.4.5 4.2 2M7.4 15c-1.4-.2-2.4-1-3-2.2 1.6-.2 2.7.3 3.5 1.3M9.3 18.3c-1.3 0-2.3-.5-3.1-1.5 1.4-.5 2.5-.2 3.3.6M15 7.5c1.8 0 3.2-.9 4-2.2-1.9-.7-3.5-.2-4.6 1.1M16.4 11.2c1.7-.4 2.8-1.4 3.3-2.9-2-.3-3.4.5-4.2 2M16.6 15c1.4-.2 2.4-1 3-2.2-1.6-.2-2.7.3-3.5 1.3M14.7 18.3c1.3 0 2.3-.5 3.1-1.5-1.4-.5-2.5-.2-3.3.6" />
    </>
  ),
  shoulder: (
    <>
      <circle cx="8" cy="6.5" r="2.4" />
      <path d="M5 20c.3-5 2.6-8 6.6-8.4 2.4-.2 4.5.6 6.4 2.3M15.5 9.5l2.2-2.6M15.7 13l3.4-.6" />
    </>
  ),
  hip: (
    <>
      <circle cx="9" cy="4.8" r="1.9" />
      <path d="M9.4 7.2 8 12.4l3.6 1.4 2.8 5.8M8 12.4l-3 7M11.6 13.8l4.6-3.2 3.2-.2" />
    </>
  ),
  ankle: (
    <>
      <path d="M9 3.5v7.2c0 1.6-.7 2.8-2 3.7-2 1.4-2 4.6.3 5.8 2.8 1.4 6.5.8 9.4-.9 1.7-1 2.2-3.2 1-4.7-.7-.9-1.8-1.4-3-1.4h-2.2" />
      <path d="M5.6 16.4h3.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10.2h17M8 3.5v4M16 3.5v4" />
    </>
  ),
  crown: <path d="M3.5 8 7 12l5-7 5 7 3.5-4-1.8 11H5.3L3.5 8Z" />,
  shield: (
    <>
      <path d="M12 3 20 6v6.2c0 4.7-3.3 7.7-8 9.3-4.7-1.6-8-4.6-8-9.3V6l8-3Z" />
      <path d="m8.6 12 2.4 2.4 4.5-4.8" />
    </>
  ),
  sword: (
    <>
      <path d="M20 3.5 9 14.5M20 3.5l-1.4 5.1-3.7-3.7L20 3.5ZM9 14.5 5.5 12 3 14.5 9.5 21l2.5-2.5-3-3" />
    </>
  ),
  bolt: <path d="M13.5 2.5 5 13.5h5.8L9.6 21.5 19 10.2h-6.2l.7-7.7Z" />,
  activity: <path d="M2.5 12h4l2.2-6.5 4.1 13 2.4-6.5h6.3" />,
  film: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="m19.2 13.6 1.3 2.2-2.6 2.6-2.2-1.3a7.8 7.8 0 0 1-2 .8L13 20.5h-2.7L9 17.9a7.8 7.8 0 0 1-2-.8l-2.2 1.3-2.6-2.6 1.3-2.2a7.8 7.8 0 0 1-.8-2L.8 11V8.3L3.4 7a7.8 7.8 0 0 1 .8-2L2.9 2.8 5.5.2 7.7 1.5a7.8 7.8 0 0 1 2-.8L10.6.1h2.7l.8 2.6a7.8 7.8 0 0 1 2 .8l2.2-1.3 2.6 2.6-1.3 2.2" transform="translate(1.5 1.9) scale(.86)" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.2 21.3 20H2.7L12 3.2Z" />
      <path d="M12 9v4.8M12 17.2v.1" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  filter: <path d="M3.5 5.5h17l-6.6 8v6l-3.8 2v-8l-6.6-8Z" />,
  star: <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.4-.6L12 3Z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 4l4 4M14 6l3 3" />
    </>
  ),
  sync: (
    <>
      <path d="M4.4 9.2a8 8 0 0 1 13.7-3.1l2 2M19.6 14.8a8 8 0 0 1-13.7 3.1l-2-2" />
      <path d="M20.4 3.5v5h-5M3.6 20.5v-5h5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cloud: <path d="M7 18.5h10.3a4.2 4.2 0 0 0 .6-8.4 6 6 0 0 0-11.6 1.2A3.7 3.7 0 0 0 7 18.5Z" />,
  database: (
    <>
      <ellipse cx="12" cy="5.7" rx="7.5" ry="2.9" />
      <path d="M4.5 5.7v12.6c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9V5.7M4.5 12c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  expand: <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />,
};

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {ICON_PATHS[name] ?? ICON_PATHS.info}
    </svg>
  );
}

export function Emblem({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeOpacity="0.28" />
      <circle cx="32" cy="32" r="24.5" stroke="currentColor" strokeOpacity="0.14" />
      <path d="M24 17.5h16L32 9 24 17.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M22.5 21h19M24.5 21v22M31 21v22M39.5 21v22M22.5 46h19" stroke="currentColor" strokeWidth="1.15" />
      <path d="M18.5 22c-5 4-6.5 10.5-3.4 16.6M45.5 22c5 4 6.5 10.5 3.4 16.6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M16 24.5c-2.3.2-3.4 2-3.6 4M19 28c-2.2.1-3.4 1.8-3.6 3.8M22.5 32.2c-2 .1-3.2 1.5-3.5 3.4M48 24.5c2.3.2 3.4 2 3.6 4M45 28c2.2.1 3.4 1.8 3.6 3.8M41.5 32.2c2 .1 3.2 1.5 3.5 3.4" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1" />
      <path d="m32 39.5 1.4 3.1 3.3.3-2.5 2.3.7 3.3-2.9-1.7-2.9 1.7.7-3.3-2.5-2.3 3.3-.3 1.4-3.1Z" fill="currentColor" />
    </svg>
  );
}

export function GreekKey({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-2 w-full text-gold/35", className)}
      viewBox="0 0 400 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <pattern id="meander" x="0" y="0" width="24" height="8" patternUnits="userSpaceOnUse">
        <path d="M1 7V2h8v4H5V4h2M9 2h8v5h5" stroke="currentColor" strokeWidth="1" fill="none" />
      </pattern>
      <rect width="400" height="8" fill="url(#meander)" />
    </svg>
  );
}

export function Card({
  children,
  className,
  glow = false,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-[7px] border border-line bg-panel/90 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]",
        glow && "border-gold/20 shadow-[0_18px_60px_-28px_rgba(196,157,94,0.18)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-muted", className)}>
      {children}
    </p>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span className="text-gold">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate font-display text-[17px] leading-tight tracking-[0.02em] text-parchment">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "gold",
  className,
  height = "h-1.5",
  animate = true,
}: {
  value: number;
  tone?: "gold" | "orange" | "teal" | "muted" | "parchment";
  className?: string;
  height?: string;
  animate?: boolean;
}) {
  const tones = {
    gold: "bg-gradient-to-r from-bronze/80 via-gold to-[#f1d6a3]",
    orange: "bg-gradient-to-r from-[#b96012] via-orange to-[#ffc078]",
    teal: "bg-gradient-to-r from-[#406e62] via-teal to-[#a4d2c4]",
    muted: "bg-gradient-to-r from-line to-muted/70",
    parchment: "bg-gradient-to-r from-[#a8a293] to-[#f3eee3]",
  } as const;
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/[0.04]", height, className)}>
      <div
        className={cn("h-full rounded-full", tones[tone], animate && "transition-[width] duration-500 ease-out")}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function RingProgress({
  value,
  size = 156,
  stroke = 6,
  children,
  tone = "orange",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  tone?: "orange" | "gold" | "teal";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const colors = {
    orange: ["#f7a33f", "#c8711c"],
    gold: ["#f1d6a3", "#b28a4a"],
    teal: ["#b6ded1", "#5a9084"],
  } as const;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[tone][0]} />
            <stop offset="100%" stopColor={colors[tone][1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#26272d" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

const RANK_STYLES: Record<string, string> = {
  S: "border-gold/60 bg-gold/15 text-[#ffe6b4]",
  A: "border-[#d8c08d]/45 bg-[#d8c08d]/10 text-[#e8d6ae]",
  B: "border-orange/45 bg-orange/10 text-[#ffc182]",
  C: "border-teal/40 bg-teal/10 text-[#b9ded3]",
  D: "border-line bg-white/[0.03] text-[#c4c7cf]",
  E: "border-line bg-white/[0.02] text-muted",
};

export function RankChip({ rank, className, compact = false }: { rank: string; className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-[3px] font-sans text-[9px] font-bold uppercase tracking-[0.16em]",
        RANK_STYLES[rank] ?? RANK_STYLES.E,
        className,
      )}
    >
      <span className="opacity-60">Rank</span>
      <span className="font-display text-[11px] leading-none tracking-normal">{rank}</span>
      {!compact ? <span className="hidden sm:inline">{rank === "S" ? "Sovereign" : rank === "A" ? "Ascendant" : rank === "B" ? "Gold" : rank === "C" ? "Silver" : "Bronze"}</span> : null}
    </span>
  );
}

export function MemberAvatar({
  monogram,
  name,
  size = 44,
  active = false,
  rank,
  className,
}: {
  monogram: string;
  name?: string;
  size?: number;
  active?: boolean;
  rank?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full border font-display tracking-[0.04em]",
          active
            ? "border-gold/65 bg-[radial-gradient(circle_at_30%_20%,#5d4427,#211a13_65%)] text-[#f8e7c4] shadow-[0_0_22px_-6px_rgba(207,165,98,0.6)]"
            : "border-line bg-[radial-gradient(circle_at_30%_20%,#30333c,#14161b_68%)] text-[#d3d2cc]",
        )}
        style={{ fontSize: Math.round(size * 0.31) }}
        aria-label={name ? `${name} monogram` : undefined}
      >
        {monogram}
      </div>
      {rank ? (
        <span className="absolute -bottom-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-line bg-obsidian px-1 font-sans text-[8px] font-bold text-gold">
          {rank}
        </span>
      ) : null}
    </div>
  );
}

type ButtonVariant = "primary" | "gold" | "secondary" | "ghost" | "danger" | "dark";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "secondary",
  size = "md",
  icon,
  trailingIcon,
  className,
  full,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  trailingIcon?: IconName;
  full?: boolean;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "border border-[#ffb25f]/30 bg-[linear-gradient(180deg,#f8a13c,#df7918)] text-[#1a1006] shadow-[0_10px_28px_-12px_rgba(241,143,46,0.75),inset_0_1px_0_rgba(255,255,255,0.28)] hover:brightness-[1.07]",
    gold: "border border-gold/40 bg-gold/10 text-[#efdbbc] hover:border-gold/65 hover:bg-gold/15",
    secondary:
      "border border-[#363945] bg-[linear-gradient(180deg,rgba(39,41,48,0.58),rgba(20,22,27,0.6))] text-[#d9d8d1] hover:border-[#4a4d58] hover:text-parchment",
    ghost: "border border-transparent text-muted hover:bg-white/[0.04] hover:text-parchment",
    danger: "border border-[#8a4636]/60 bg-[#5c2a20]/25 text-[#f0b7a8] hover:bg-[#6b3025]/40",
    dark: "border border-line bg-black/30 text-[#c9c8c1] hover:border-gold/30 hover:text-parchment",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "min-h-8 rounded-[4px] px-2.5 py-1.5 text-[10px] tracking-[0.12em]",
    md: "min-h-10 rounded-[5px] px-3.5 py-2.5 text-[11px] tracking-[0.1em]",
    lg: "min-h-11 rounded-[5px] px-5 py-3 text-[11px] tracking-[0.12em]",
  };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold uppercase transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        full && "w-full",
        className,
      )}
      {...props}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
      {trailingIcon ? <Icon name={trailingIcon} size={size === "sm" ? 13 : 15} /> : null}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid h-9 w-9 cursor-pointer place-items-center rounded-[4px] border border-line bg-white/[0.02] text-muted transition-colors hover:border-gold/35 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border transition-colors",
          checked ? "border-orange/60 bg-orange/30" : "border-line bg-black/50",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-[14px] w-[14px] rounded-full transition-all",
            checked ? "left-[21px] bg-orange shadow-[0_0_8px_rgba(241,143,46,0.6)]" : "left-[3px] bg-muted",
          )}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium leading-snug text-[#dedbd3]">{label}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function ExerciseCheckbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "mt-[1px] grid h-[19px] w-[19px] shrink-0 cursor-pointer place-items-center rounded-[3px] border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        checked
          ? "border-[#df8a2d] bg-[linear-gradient(180deg,#f5a84c,#d98122)] text-[#201407]"
          : "border-[#474a54] bg-black/30 text-transparent hover:border-gold/60",
        className,
      )}
    >
      <Icon name="check" size={12} strokeWidth={2.3} />
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "orange" | "teal" | "danger" | "dark";
  className?: string;
  dot?: boolean;
}) {
  const tones = {
    neutral: "border-line bg-white/[0.03] text-[#b9bbc3]",
    gold: "border-gold/30 bg-gold/[0.08] text-[#dfc79b]",
    orange: "border-orange/35 bg-orange/[0.09] text-[#ffc38a]",
    teal: "border-teal/30 bg-teal/[0.08] text-[#b3d8cd]",
    danger: "border-[#8a4636]/50 bg-[#5c2a20]/20 text-[#e7ab9d]",
    dark: "border-line/80 bg-black/40 text-muted",
  } as const;
  const dotTones = {
    neutral: "bg-muted",
    gold: "bg-gold",
    orange: "bg-orange",
    teal: "bg-teal",
    danger: "bg-[#c4634f]",
    dark: "bg-muted",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-[3px] font-sans text-[9px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1 w-1 rounded-full", dotTones[tone])} /> : null}
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[10px] border border-[#3b3c45] bg-[#131519] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)] sm:rounded-[8px]",
          width,
        )}
      >
        <GreekKey className="opacity-60" />
        <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:px-6">
          <div>
            {eyebrow ? <Eyebrow className="text-gold/70">{eyebrow}</Eyebrow> : null}
            <h2 className="mt-1 font-display text-[21px] leading-tight text-parchment">{title}</h2>
          </div>
          <IconButton icon="x" label="Close dialog" onClick={onClose} />
        </div>
        <div className="px-5 pb-6 pt-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon = "leaf", title, detail }: { icon?: IconName; title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[5px] border border-dashed border-line bg-black/20 px-5 py-8 text-center">
      <span className="mb-2 text-gold/55">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-display text-[15px] text-[#dedbd3]">{title}</p>
      <p className="mt-1 max-w-[36ch] text-[11px] leading-relaxed text-muted">{detail}</p>
    </div>
  );
}
