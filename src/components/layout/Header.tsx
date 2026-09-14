'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePomodoro } from '../pomodoro/PomodoroContext';
import {
  CheckSquare,
  Bell,
  Play,
  Pause,
  Timer,
  Search,
  Calendar,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickCapture: () => void;
  onOpenDailyPlanning: () => void;
}

export function Header({
  onOpenQuickCapture,
  onOpenDailyPlanning,
}: HeaderProps) {
  const { isRunning, timeLeft, startTimer, pauseTimer, formatTime } = usePomodoro();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="group flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-zinc-900">
                MrFocus
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search & Quick Capture Bar Trigger */}
        <div className="flex flex-1 max-w-md mx-3 sm:mx-6">
          <button
            onClick={onOpenQuickCapture}
            className="group flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-500 transition-all hover:border-zinc-400 hover:bg-white"
          >
            <div className="flex items-center space-x-2 truncate">
              <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700" />
              <span className="truncate">
                Captura rápida con lenguaje natural...
              </span>
            </div>
            <kbd className="hidden rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 md:inline-block">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Daily Planning Button */}
          <button
            onClick={onOpenDailyPlanning}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-sm"
            title="Planificación diaria matutina guiada"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Planificar Día</span>
          </button>

          {/* Active Focus Timer Pill */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium">
            <Link href="/focus" className="flex items-center space-x-1.5 text-zinc-700 hover:text-zinc-950">
              <Timer className={`h-3.5 w-3.5 ${isRunning ? 'animate-pulse text-indigo-600' : 'text-zinc-400'}`} />
              <span className="font-mono font-medium text-zinc-800">{formatTime(timeLeft)}</span>
            </Link>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="ml-1.5 text-zinc-400 hover:text-zinc-900"
              title={isRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
            >
              {isRunning ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setHasUnread(false);
              }}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg z-50">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="text-xs font-semibold text-zinc-700">Notificaciones</h4>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  <div className="flex items-start space-x-2.5 rounded-lg bg-zinc-50 p-2.5">
                    <Layers className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">Planificación diaria disponible</p>
                      <p className="text-[11px] text-zinc-500">Revisa tu backlog y organiza tus bloques de tiempo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
