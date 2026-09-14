'use client';

import React, { useState } from 'react';
import { ArrowLeft, Activity, BookOpen, Sun, Calendar, CheckSquare } from 'lucide-react';
import { Habit } from '@/types';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitCreated: (habit: Habit) => void;
}

const ICONS = [
  { name: 'Activity', label: 'Salud', icon: Activity },
  { name: 'BookOpen', label: 'Estudio', icon: BookOpen },
  { name: 'Sun', label: 'Mañana', icon: Sun },
  { name: 'Calendar', label: 'Rutina', icon: Calendar },
  { name: 'CheckSquare', label: 'General', icon: CheckSquare },
];

export function NewHabitModal({
  isOpen,
  onClose,
  onHabitCreated,
}: NewHabitModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Salud');
  const [icon, setIcon] = useState('Activity');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          icon,
          frequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onHabitCreated(data.habit);
        onClose();
        setName('');
      }
    } catch (err) {
      console.error('Error creating habit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-y-auto animate-in fade-in duration-100">
      {/* Native Mobile Top Navigation Bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <h2 className="text-xs sm:text-sm font-bold text-[#18181B]">
          Nuevo Hábito
        </h2>

        <div className="w-12" />
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                Nombre del Hábito
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lectura diaria, Ejercicio matutino..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                Categoría
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Salud, Estudio, Productividad..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                Icono Representativo
              </label>
              <div className="mt-2 flex items-center space-x-2.5">
                {ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#18181B] bg-[#18181B] text-white shadow-xs scale-105'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
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
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="rounded-xl bg-[#18181B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#27272a] transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Hábito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

