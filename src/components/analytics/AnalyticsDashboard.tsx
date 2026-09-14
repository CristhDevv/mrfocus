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
          <h2 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#18181B]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span>Métricas de Rendimiento</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Análisis de tiempo enfocado y distribución de proyectos
          </p>
        </div>
        <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeRange === r
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === '7d' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tiempo de Foco</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#18181B]">
            {formatMinutes(totalMinutes)}
          </p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">
            {allSessions.length} {allSessions.length === 1 ? 'sesión' : 'sesiones'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sesiones Pomodoro</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#18181B]">
            {pomodoroSessionsCount}
          </p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">
            {pomodoroSessionsCount * 25} minutos
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Precisión</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#18181B]">
            {accuracyRatio}%
          </p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">
            Real vs Estimado
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tareas Hechas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#18181B]">
            {completedTasks.length}
          </p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">
            Completadas
          </span>
        </div>
      </div>

      {/* Project Distribution & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-4 flex items-center space-x-2">
            <Folder className="h-4 w-4 text-[#18181B]" />
            <span>Tiempo por Proyecto</span>
          </h3>

          <div className="space-y-3.5">
            {projectStats.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center font-medium">
                No hay sesiones de tiempo registradas aún.
              </p>
            ) : (
              projectStats.map((p, idx) => {
                const colors = ['#18181B', '#059669', '#475569', '#94a3b8', '#cbd5e1'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#18181B]">{p.name}</span>
                      <span className="text-slate-500">
                        {formatMinutes(p.minutes)} ({p.percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${p.percentage}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-4 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-[#18181B]" />
            <span>Sesiones Recientes</span>
          </h3>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-64 pr-1">
            {allSessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center font-medium">
                Inicia un temporizador para ver el registro aquí.
              </p>
            ) : (
              allSessions.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3 text-xs border border-slate-100 transition-all hover:bg-white hover:border-slate-200"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="h-2 w-2 rounded-full bg-[#059669]" />
                    <span className="font-semibold text-[#18181B] truncate">
                      {s.notes || s.taskTitle || 'Sesión de enfoque'}
                    </span>
                  </div>
                  <span className="rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]/60 px-2 py-0.5 text-[11px] font-bold text-[#059669] shrink-0">
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
