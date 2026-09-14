'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { sounds } from '@/lib/audio';

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

interface PomodoroContextType {
  mode: PomodoroMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  sessionsCompletedToday: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: PomodoroMode) => void;
  setActiveTask: (id: string | null, title?: string | null) => void;
  formatTime: (seconds: number) => string;
}

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.focus);
  const [totalDuration, setTotalDuration] = useState<number>(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(0);

  const startTimeRef = useRef<Date | null>(null);

  // Request browser notification permission if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, activeTaskId]);

  const handleComplete = async () => {
    setIsRunning(false);
    sounds.playTimerEnd();

    // Trigger browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const msg =
        mode === 'focus'
          ? '¡Excelente sesión de enfoque completada! Tómate un merecido descanso.'
          : '¡Descanso terminado! Listo para volver al flujo de trabajo.';
      new Notification('MrFocus - Temporizador', { body: msg, icon: '/favicon.ico' });
    }

    // Try triggering confetti
    if (typeof window !== 'undefined' && mode === 'focus') {
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      } catch {
        // ignore
      }
    }

    // If it was a focus session, save to backend time_sessions API
    if (mode === 'focus') {
      const durationMins = Math.round(totalDuration / 60);
      const now = new Date();
      const start = startTimeRef.current || new Date(now.getTime() - totalDuration * 1000);

      try {
        await fetch('/api/time-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: activeTaskId || undefined,
            type: 'pomodoro',
            startTime: start.toISOString(),
            endTime: now.toISOString(),
            durationMinutes: durationMins,
            notes: activeTaskTitle ? `Sesión Pomodoro: ${activeTaskTitle}` : 'Sesión de enfoque Pomodoro',
          }),
        });

        setSessionsCompletedToday((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to save pomodoro session:', err);
      }
    }
  };

  const startTimer = () => {
    if (!isRunning) {
      startTimeRef.current = new Date();
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
    setTotalDuration(DURATIONS[mode]);
  };

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setTotalDuration(DURATIONS[newMode]);
  };

  const setActiveTask = (id: string | null, title?: string | null) => {
    setActiveTaskId(id);
    setActiveTaskTitle(title || null);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <PomodoroContext.Provider
      value={{
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
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
