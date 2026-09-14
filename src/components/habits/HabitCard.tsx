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
  BookOpen: <BookOpen className="h-4 w-4 text-zinc-700" />,
  Activity: <Activity className="h-4 w-4 text-zinc-700" />,
  Sun: <Sun className="h-4 w-4 text-zinc-700" />,
  Calendar: <Calendar className="h-4 w-4 text-zinc-700" />,
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
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
      <div>
        {/* Habit Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">
              {ICONS_MAP[habit.icon] || <Activity className="h-4 w-4 text-zinc-700" />}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">
                {habit.name}
              </h4>
              <span className="text-[11px] text-zinc-500">{habit.category}</span>
            </div>
          </div>

          <button
            onClick={() => onDeleteHabit(habit.id)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Eliminar hábito"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Streaks row */}
        <div className="mt-3 flex items-center space-x-2 text-[11px]">
          <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 border border-zinc-200">
            {habit.streak} días racha
          </span>
          <span className="text-zinc-400">
            Récord: {habit.bestStreak}d
          </span>
        </div>
      </div>

      {/* 7-day mini check-in tracker */}
      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
            Últimos 7 días
          </span>

          <div className="flex items-center space-x-1">
            {last7Days.map((d) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={(e) => handleToggle(e, d.dateStr)}
                title={`${d.dateStr}: ${d.isCompleted ? 'Completado' : 'Pendiente'}`}
                className={`flex h-6 w-6 flex-col items-center justify-center rounded-md text-[10px] font-medium transition-all ${
                  d.isCompleted
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {d.isCompleted ? (
                  <Check className="h-3 w-3 stroke-[2.5]" />
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
