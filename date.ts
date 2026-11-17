import type { DayShort, Session } from "./types";

const DAYS: DayShort[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_LABELS: DayShort[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const pad = (n: number) => String(n).padStart(2, "0");

export function dateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addDaysToKey(key: string, amount: number): string {
  return dateKey(addDays(parseKey(key), amount));
}

export function dayShort(date: Date = new Date()): DayShort {
  return DAYS[date.getDay()];
}

export function dayLong(date: Date = new Date()): string {
  return LONG_DAYS[date.getDay()];
}

export function startOfWeek(date: Date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const offset = (copy.getDay() + 6) % 7; // Monday first
  return addDays(copy, -offset);
}

export function weekKeys(reference: Date = new Date()): string[] {
  const start = startOfWeek(reference);
  return Array.from({ length: 7 }, (_, index) => dateKey(addDays(start, index)));
}

/** Consecutive dates ending yesterday, used to seed an honest demo streak. */
export function previousConsecutiveKeys(count: number, reference: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => dateKey(addDays(reference, -(index + 1))));
}

export function lastNDays(count: number, reference: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => dateKey(addDays(reference, -index)));
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds % 60)}s`;
  return `${seconds}s`;
}

export function formatHoursMinutes(totalSeconds: number): { value: string; unit: string } {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { value: `${hours}h ${pad(minutes)}m`, unit: "total training" };
}

export function formatClockFromMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatShortDate(key: string): string {
  return parseKey(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatInvocation(date: Date = new Date()): string {
  return date
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
}

export function sessionForDate(schedule: Session[], date: Date = new Date()): Session | undefined {
  const day = dayShort(date);
  return schedule.find((session) => session.day === day);
}
