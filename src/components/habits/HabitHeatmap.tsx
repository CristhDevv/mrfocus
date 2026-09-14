'use client';

import React from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from 'lucide-react';

interface HabitHeatmapProps {
  completedDates: string[]; // array of 'YYYY-MM-DD'
  totalHabitsCount?: number;
  daysToShow?: number; // default 84 days (12 weeks)
}

export function HabitHeatmap({
  completedDates,
  totalHabitsCount = 4,
  daysToShow = 84,
}: HabitHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, daysToShow - 1);
  const days = eachDayOfInterval({ start: startDate, end: today });

  const countsMap: Record<string, number> = {};
  completedDates.forEach((d) => {
    countsMap[d] = (countsMap[d] || 0) + 1;
  });

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-zinc-100';
    if (count === 1) return 'bg-zinc-300';
    if (count === 2) return 'bg-zinc-500';
    if (count === 3) return 'bg-zinc-700';
    return 'bg-zinc-900';
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center space-x-1.5">
            <Activity className="h-3.5 w-3.5 text-zinc-700" />
            <span>Consistencia de Hábitos (Últimos 3 Meses)</span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Distribución de hábitos completados por día
          </p>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
          <span>Menos</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-zinc-100" />
          <div className="h-2.5 w-2.5 rounded-sm bg-zinc-300" />
          <div className="h-2.5 w-2.5 rounded-sm bg-zinc-500" />
          <div className="h-2.5 w-2.5 rounded-sm bg-zinc-700" />
          <div className="h-2.5 w-2.5 rounded-sm bg-zinc-900" />
          <span>Más</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-2 overflow-x-auto pb-1">
        <div className="inline-grid grid-flow-col grid-rows-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = countsMap[dateStr] || 0;
            return (
              <div
                key={dateStr}
                title={`${format(day, 'd MMM yyyy', { locale: es })}: ${count} hábitos completados`}
                className={`h-3 w-3 rounded-sm transition-all hover:ring-1 hover:ring-zinc-900 cursor-pointer ${getColorClass(
                  count
                )}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
