'use client';

import React from 'react';
import { Habit } from '@/types';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { sounds } from '@/lib/audio';
import {
  Check,
  Activity,
  Trash2,
  BookOpen,
  Sun,
  Calendar,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onToggleToday: (habitId: string) => void;
  onToggleDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-4 w-4 text-[#18181B]" />,
  Activity: <Activity className="h-4 w-4 text-[#18181B]" />,
  Sun: <Sun className="h-4 w-4 text-[#18181B]" />,
  Calendar: <Calendar className="h-4 w-4 text-[#18181B]" />,
};

export function HabitCard({
  habit,
  onToggleToday,
  onToggleDate,
  onDeleteHabit,
}: HabitCardProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dStr = format(d, 'yyyy-MM-dd');
    return {
      date: d,
      dateStr: dStr,
      isCompleted: habit.completedDates.includes(dStr),
      dayLabel: format(d, 'EEEEE', { locale: es }),
    };
  });

  const handleToggle = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    sounds.playComplete();
    onToggleDate(habit.id, dateStr);
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      <div>
        {/* Habit Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-[#18181B]">
              {ICONS_MAP[habit.icon] || <Activity className="h-4 w-4 text-[#18181B]" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#18181B]">
                {habit.name}
              </h4>
              <span className="text-xs font-medium text-slate-500">{habit.category}</span>
            </div>
          </div>

          <button
            onClick={() => onDeleteHabit(habit.id)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Eliminar hábito"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Streaks row */}
        <div className="mt-3.5 flex items-center space-x-2 text-xs">
          <span className="rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]/60 px-2.5 py-0.5 font-bold text-[#059669]">
            {habit.streak} días racha
          </span>
          <span className="text-slate-500 font-medium">
            Récord: {habit.bestStreak}d
          </span>
        </div>
      </div>

      {/* 7-day mini check-in tracker */}
      <div className="mt-4 border-t border-slate-100 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Últimos 7 días
          </span>

          <div className="flex items-center space-x-1.5">
            {last7Days.map((d) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={(e) => handleToggle(e, d.dateStr)}
                title={`${d.dateStr}: ${d.isCompleted ? 'Completado' : 'Pendiente'}`}
                className={`flex h-7 w-7 flex-col items-center justify-center rounded-xl text-[11px] font-semibold transition-all ${
                  d.isCompleted
                    ? 'bg-[#059669] text-white shadow-xs ring-1 ring-[#059669]'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {d.isCompleted ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  <span>{d.dayLabel}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
