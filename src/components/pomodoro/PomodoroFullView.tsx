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

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 2 * Math.PI * 110 * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-8 px-4 text-center space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-1.5 rounded-lg border border-zinc-200 bg-zinc-100 p-1">
        <button
          onClick={() => switchMode('focus')}
          className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
            mode === 'focus'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Enfoque (25m)
        </button>
        <button
          onClick={() => switchMode('short_break')}
          className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
            mode === 'short_break'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Descanso Corto (5m)
        </button>
        <button
          onClick={() => switchMode('long_break')}
          className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
            mode === 'long_break'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Descanso Largo (15m)
        </button>
      </div>

      {/* Circular Progress Timer */}
      <div className="relative flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90 transform" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="110"
            className="stroke-zinc-100"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="120"
            cy="120"
            r="110"
            className="stroke-zinc-900 transition-all duration-1000 ease-linear"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-5xl font-bold tracking-tight text-zinc-900">
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
            {mode === 'focus' ? 'Sesión de Enfoque' : 'Tiempo de Descanso'}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={resetTimer}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 transition-all"
          title="Reiniciar temporizador"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className="flex items-center space-x-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
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
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-left space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center space-x-1.5">
            <ListTodo className="h-3.5 w-3.5 text-zinc-600" />
            <span>Tarea Activa Vinculada</span>
          </h4>
          <span className="text-[11px] text-zinc-400">
            {sessionsCompletedToday} sesiones hoy
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
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
        >
          <option value="">(Sin tarea seleccionada - Enfoque libre)</option>
          {availableTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} (P{t.priority})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
