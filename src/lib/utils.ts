import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatTimeRange(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '';
  const s = new Date(startIso);
  const e = new Date(endIso);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formatTime(s)} - ${formatTime(e)}`;
}

export function getPriorityLabel(priority: number): { label: string; color: string; bg: string; border: string } {
  switch (priority) {
    case 1:
      return { label: 'P1 Urgente', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    case 2:
      return { label: 'P2 Alta', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    case 3:
      return { label: 'P3 Media', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    case 4:
    default:
      return { label: 'P4 Baja', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  }
}
