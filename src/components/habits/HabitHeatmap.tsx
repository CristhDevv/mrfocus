'use client';

import React from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from 'lucide-react';

interface HabitHeatmapProps {
  completedDates: string[]; // array of 'YYYY-MM-DD'
  totalHabitsCount?: number;
  daysToShow?: number; // default 28 days (4 weeks) for perfect mobile fit
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function HabitHeatmap({
  completedDates,
  totalHabitsCount = 4,
  daysToShow = 28,
}: HabitHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, daysToShow - 1);
  const days = eachDayOfInterval({ start: startDate, end: today });

  const countsMap: Record<string, number> = {};
  completedDates.forEach((d) => {
    countsMap[d] = (countsMap[d] || 0) + 1;
  });

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 border border-slate-200/60 text-slate-400';
    if (count === 1) return 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] font-bold';
    if (count === 2) return 'bg-[#a7f3d0] border border-[#6ee7b7] text-[#047857] font-bold';
    if (count === 3) return 'bg-[#34d399] border border-[#10b981] text-white font-bold';
    return 'bg-[#059669] border border-[#047857] text-white font-bold';
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
            <Activity className="h-4 w-4 text-[#059669]" />
            <span>Consistencia Diaria (Últimas 4 Semanas)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Registro de hábitos completados día a día
          </p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium self-start sm:self-auto">
          <span className="text-[10px]">Menos</span>
          <div className="h-3 w-3 rounded-md bg-slate-100 border border-slate-200" />
          <div className="h-3 w-3 rounded-md bg-[#ecfdf5] border border-[#a7f3d0]" />
          <div className="h-3 w-3 rounded-md bg-[#a7f3d0]" />
          <div className="h-3 w-3 rounded-md bg-[#34d399]" />
          <div className="h-3 w-3 rounded-md bg-[#059669]" />
          <span className="text-[10px]">Más</span>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="mt-3.5 grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {WEEKDAYS.map((wd, i) => (
          <span key={i} className="text-[10px] sm:text-xs font-bold text-slate-400">
            {wd}
          </span>
        ))}
      </div>

      {/* Responsive Calendar Heatmap Grid (Zero Horizontal Scroll!) */}
      <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2 w-full">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = countsMap[dateStr] || 0;
          return (
            <div
              key={dateStr}
              title={`${format(day, 'd MMM yyyy', { locale: es })}: ${count} hábitos completados`}
              className={`flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2.5 h-10 sm:h-12 transition-all hover:scale-105 shadow-2xs ${getColorClass(
                count
              )}`}
            >
              <span className="text-[11px] sm:text-xs leading-none">
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none opacity-90">
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

