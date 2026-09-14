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
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-[#ecfdf5]';
    if (count === 2) return 'bg-[#a7f3d0]';
    if (count === 3) return 'bg-[#34d399]';
    return 'bg-[#059669]';
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
            <Activity className="h-4 w-4 text-[#059669]" />
            <span>Consistencia de Hábitos (Últimos 3 Meses)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Frecuencia de hábitos completados por día
          </p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium self-end sm:self-auto">
          <span>Menos</span>
          <div className="h-3 w-3 rounded-md bg-slate-100 border border-slate-200" />
          <div className="h-3 w-3 rounded-md bg-[#ecfdf5] border border-[#a7f3d0]" />
          <div className="h-3 w-3 rounded-md bg-[#a7f3d0]" />
          <div className="h-3 w-3 rounded-md bg-[#34d399]" />
          <div className="h-3 w-3 rounded-md bg-[#059669]" />
          <span>Más</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-3 overflow-x-auto pb-1">
        <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = countsMap[dateStr] || 0;
            return (
              <div
                key={dateStr}
                title={`${format(day, 'd MMM yyyy', { locale: es })}: ${count} hábitos completados`}
                className={`h-3.5 w-3.5 rounded-md transition-all hover:scale-125 cursor-pointer shadow-2xs ${getColorClass(
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
