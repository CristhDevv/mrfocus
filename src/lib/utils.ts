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

export function getPriorityLabel(priority: number): { label: string; color: string; bg: string; border: string; hex: string } {
  switch (priority) {
    case 1:
      return { label: 'Urgente', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', hex: '#e11d48' };
    case 2:
      return { label: 'Alta', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', hex: '#d97706' };
    case 3:
      return { label: 'Media', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', hex: '#0284c7' };
    case 4:
    default:
      return { label: 'Normal', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', hex: '#64748b' };
  }
}
