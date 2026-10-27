import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDate(iso: string | null | undefined, withWeekday = false): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const base = `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  if (!withWeekday) return base;
  const day = new Date(y, m - 1, d).getDay();
  return `${base} (${WEEKDAYS[day]})`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(toLocalISODate(date))} ${hh}:${mm}`;
}

export function relativeDayLabel(iso: string): string {
  const today = toLocalISODate();
  if (iso === today) return "오늘";
  if (iso === addDays(1)) return "내일";
  if (iso === addDays(-1)) return "어제";
  return iso < today ? "지난 일정" : "예정";
}

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const inputClass =
  "w-full rounded-2xl border border-transparent bg-gray-50 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted hover:bg-gray-100/80 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100";