'use client';

import React, { useState } from 'react';
import { X, Activity, BookOpen, Sun, Calendar, CheckSquare } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">
            Nuevo Hábito
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Nombre del Hábito
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lectura diaria, Ejercicio matutino..."
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Salud, Estudio, Productividad..."
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Icono
            </label>
            <div className="mt-1 flex items-center space-x-2">
              {ICONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                      icon === item.name
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
