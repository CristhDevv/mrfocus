'use client';

import React, { useState, useEffect } from 'react';
import { usePomodoro } from './PomodoroContext';
import { Task } from '@/types';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

interface PomodoroFullViewProps {
  tasks?: Task[];
}

export function PomodoroFullView({ tasks = [] }: PomodoroFullViewProps) {
  const {
    mode,
    timeLeft,
    totalDuration,
    isRunning,
    activeTaskId,
    activeTaskTitle,
    sessionsCompletedToday,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    setActiveTask,
    formatTime,
  } = usePomodoro();

  const [availableTasks, setAvailableTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    if (tasks.length === 0) {
      fetch('/api/tasks?status=todo')
        .then((res) => res.json())
        .then((data) => setAvailableTasks(data.tasks || []))
        .catch(() => {});
    }
  }, [tasks]);

  const strokeColor =
    mode === 'focus' ? '#18181B' : '#059669';

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-8 px-4 text-center space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 shadow-xs">
        <button
          onClick={() => switchMode('focus')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            mode === 'focus'
              ? 'bg-[#18181B] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Enfoque (25 min)
        </button>
        <button
          onClick={() => switchMode('short_break')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            mode === 'short_break'
              ? 'bg-white text-[#059669] shadow-sm font-extrabold border border-[#a7f3d0]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Descanso Corto (5 min)
        </button>
        <button
          onClick={() => switchMode('long_break')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            mode === 'long_break'
              ? 'bg-white text-[#059669] shadow-sm font-extrabold border border-[#a7f3d0]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Descanso Largo (15 min)
        </button>
      </div>

      {/* Circular Progress Timer */}
      <div className="relative flex items-center justify-center py-2">
        <svg className="h-68 w-68 -rotate-90 transform" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="105"
            stroke="#f1f5f9"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="120"
            cy="120"
            r="105"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 105}
            strokeDashoffset={2 * Math.PI * 105 * (1 - progress)}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-5xl font-extrabold tracking-tight text-[#18181B]">
            {formatTime(timeLeft)}
          </span>
          <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            {mode === 'focus' ? 'Sesión de Enfoque' : 'Tiempo de Descanso'}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={resetTimer}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-xs"
          title="Reiniciar temporizador"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className="flex items-center space-x-2.5 rounded-2xl bg-[#18181B] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#27272a] transition-all active:scale-95"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Iniciar Sesión</span>
            </>
          )}
        </button>
      </div>

      {/* Active Task Selector */}
      <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs text-left space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
            <ListTodo className="h-4 w-4 text-[#18181B]" />
            <span>Tarea Activa Vinculada</span>
          </h4>
          <span className="rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]/60 px-2.5 py-0.5 text-xs font-bold text-[#059669]">
            {sessionsCompletedToday} {sessionsCompletedToday === 1 ? 'sesión hoy' : 'sesiones hoy'}
          </span>
        </div>

        <select
          value={activeTaskId || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              setActiveTask(null, null);
            } else {
              const selected = availableTasks.find((t) => t.id === val);
              setActiveTask(val, selected?.title);
            }
          }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#18181B]/10 focus:border-[#18181B] transition-all"
        >
          <option value="">(Sin tarea seleccionada - Enfoque libre)</option>
          {availableTasks.map((t) => {
            const priorityText =
              t.priority === 1
                ? 'Urgente'
                : t.priority === 2
                ? 'Alta'
                : t.priority === 3
                ? 'Media'
                : 'Normal';
            return (
              <option key={t.id} value={t.id}>
                {t.title} - Prioridad {priorityText}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
