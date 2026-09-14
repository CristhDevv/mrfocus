'use client';

import React, { useState, useEffect } from 'react';
import { Habit } from '@/types';
import { HabitHeatmap } from '@/components/habits/HabitHeatmap';
import { HabitCard } from '@/components/habits/HabitCard';
import { Activity, Plus, BookOpen, Sun, Calendar, CheckSquare, X } from 'lucide-react';
import { format } from 'date-fns';

const ICONS = [
  { name: 'Activity', label: 'Salud', icon: Activity },
  { name: 'BookOpen', label: 'Estudio', icon: BookOpen },
  { name: 'Sun', label: 'Mañana', icon: Sun },
  { name: 'Calendar', label: 'Rutina', icon: Calendar },
  { name: 'CheckSquare', label: 'General', icon: CheckSquare },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New Habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Salud');
  const [newHabitIcon, setNewHabitIcon] = useState('Activity');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newHabitName.trim(),
          category: newHabitCategory,
          icon: newHabitIcon,
          frequency: newHabitFrequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHabits([...habits, data.habit]);
        setNewHabitName('');
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error('Error creating habit:', err);
    } finally {
      setIsSubmitting(false);
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
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 ${
            isFormOpen
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-[#18181B] text-white hover:bg-[#27272a]'
          }`}
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isFormOpen ? 'Cancelar' : 'Nuevo Hábito'}</span>
        </button>
      </div>

      {/* Inline New Habit Form (Zero Modals!) */}
      {isFormOpen && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-in fade-in duration-150 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#18181B]">
              Crear Nuevo Hábito
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Define tu rutina diaria</span>
          </div>

          <form onSubmit={handleCreateHabit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Nombre del Hábito
                </label>
                <input
                  type="text"
                  required
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Ej: Lectura matutina, 2L de agua, Meditación..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Categoría
                </label>
                <input
                  type="text"
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                  placeholder="Salud, Estudio, Bienestar, Productividad..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Icono Distintivo
              </label>
              <div className="mt-2 flex items-center space-x-2.5">
                {ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = newHabitIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setNewHabitIcon(item.name)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs scale-105'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title={item.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newHabitName.trim() || isSubmitting}
                className="rounded-xl bg-[#18181B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Hábito'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 90-day Heatmap */}
      <HabitHeatmap completedDates={allCompletedDates} totalHabitsCount={habits.length} />

      {/* Habits Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
          Hábitos Activos ({habits.length})
        </h3>

        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#18181B]">
              <Activity className="h-6 w-6" />
            </div>
            <p className="mt-3 text-xs font-bold text-[#18181B]">
              No tienes hábitos creados todavía
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Haz clic en &quot;Nuevo Hábito&quot; para registrar tus rutinas diarias y construir rachas.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

