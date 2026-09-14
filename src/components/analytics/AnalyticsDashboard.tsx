'use client';

import React, { useState, useEffect } from 'react';
import { TimeSession, Project, Task } from '@/types';
import {
  BarChart3,
  Clock,
  Target,
  Folder,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { formatMinutes } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface AnalyticsDashboardProps {
  sessions?: TimeSession[];
  projects?: Project[];
  tasks?: Task[];
}

export function AnalyticsDashboard({
  sessions = [],
  projects = [],
  tasks = [],
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [allSessions, setAllSessions] = useState<TimeSession[]>(sessions);

  useEffect(() => {
    fetchSessions();
  }, [timeRange]);

  const fetchSessions = async () => {
    try {
      const days = timeRange === '7d' ? 7 : 30;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const res = await fetch(`/api/time-sessions?startDate=${startDate}T00:00:00`);
      if (res.ok) {
        const data = await res.json();
        setAllSessions(data.sessions || []);
      }
    } catch {
      // ignore
    }
  };

  const totalMinutes = allSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const pomodoroSessionsCount = allSessions.filter((s) => s.type === 'pomodoro').length;

  const projectTimeMap: Record<string, number> = {};
  allSessions.forEach((s) => {
    const pName = s.projectName || 'General';
    projectTimeMap[pName] = (projectTimeMap[pName] || 0) + s.durationMinutes;
  });

  const projectStats = Object.entries(projectTimeMap).map(([name, mins]) => ({
    name,
    minutes: mins,
    percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
  }));

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const totalPlannedMins = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const totalActualMins = completedTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
  const accuracyRatio = totalPlannedMins > 0 ? Math.round((totalActualMins / totalPlannedMins) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center space-x-1.5">
            <BarChart3 className="h-4 w-4 text-zinc-700" />
            <span>Métricas de Rendimiento</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Análisis de tiempo enfocado y distribución de proyectos
          </p>
        </div>
        <div className="flex items-center space-x-1 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                timeRange === r
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {r === '7d' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Tiempo de Foco</span>
            <Clock className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900">
            {formatMinutes(totalMinutes)}
          </p>
          <span className="text-[11px] text-zinc-500">
            {allSessions.length} sesiones
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Sesiones Pomodoro</span>
            <Target className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900">
            {pomodoroSessionsCount}
          </p>
          <span className="text-[11px] text-zinc-500">
            {pomodoroSessionsCount * 25} minutos
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Precisión de Estimación</span>
            <TrendingUp className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900">
            {accuracyRatio}%
          </p>
          <span className="text-[11px] text-zinc-500">
            Real vs Estimado
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Tareas Hechas</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-600" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900">
            {completedTasks.length}
          </p>
          <span className="text-[11px] text-zinc-500">
            Completadas
          </span>
        </div>
      </div>

      {/* Project Distribution & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-3 flex items-center space-x-1.5">
            <Folder className="h-3.5 w-3.5 text-zinc-600" />
            <span>Tiempo por Proyecto</span>
          </h3>

          <div className="space-y-3">
            {projectStats.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-6 text-center">
                No hay sesiones de tiempo registradas aún.
              </p>
            ) : (
              projectStats.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800">{p.name}</span>
                    <span className="text-zinc-500">
                      {formatMinutes(p.minutes)} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-zinc-800 rounded-full transition-all duration-300"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-3 flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-600" />
            <span>Sesiones Recientes</span>
          </h3>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-60 pr-1">
            {allSessions.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-6 text-center">
                Inicia un temporizador para ver el registro aquí.
              </p>
            ) : (
              allSessions.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-xs border border-zinc-100"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-zinc-700" />
                    <span className="font-medium text-zinc-800 truncate">
                      {s.notes || s.taskTitle || 'Sesión de enfoque'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-medium text-zinc-700 shrink-0">
                    +{s.durationMinutes}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
