'use client';

import React, { useState, useEffect } from 'react';
import { Habit } from '@/types';
import { HabitHeatmap } from '@/components/habits/HabitHeatmap';
import { HabitCard } from '@/components/habits/HabitCard';
import { NewHabitModal } from '@/components/habits/NewHabitModal';
import { Activity, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
      }
    } catch (err) {
      console.error('Error loading habits:', err);
    }
  };

  const handleToggleDate = async (habitId: string, dateStr: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr }),
      });
      if (res.ok) {
        loadHabits();
      }
    } catch (err) {
      console.error('Error toggling habit date:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('¿Eliminar este hábito?')) {
      try {
        const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
        if (res.ok) {
          setHabits(habits.filter((h) => h.id !== habitId));
        }
      } catch (err) {
        console.error('Error deleting habit:', err);
      }
    }
  };

  const allCompletedDates = habits.flatMap((h) => h.completedDates);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#18181B] flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
              <Activity className="h-4 w-4" />
            </div>
            <span>Hábitos & Rutinas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Seguimiento de consistencia diaria y registro histórico
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#27272a] transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Hábito</span>
        </button>
      </div>

      {/* 90-day Heatmap */}
      <HabitHeatmap completedDates={allCompletedDates} totalHabitsCount={habits.length} />

      {/* Habits Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
          Hábitos Activos ({habits.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleToday={(id) => handleToggleDate(id, format(new Date(), 'yyyy-MM-dd'))}
              onToggleDate={handleToggleDate}
              onDeleteHabit={handleDeleteHabit}
            />
          ))}
        </div>
      </div>

      <NewHabitModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onHabitCreated={(newHabit) => setHabits([...habits, newHabit])}
      />
    </div>
  );
}
