'use client';

import React, { useState, useEffect } from 'react';
import { Task, Habit, CalendarEvent } from '@/types';
import { sounds } from '@/lib/audio';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Activity,
  Check,
  Sparkles,
  X,
} from 'lucide-react';
import { getPriorityLabel, formatMinutes } from '@/lib/utils';

interface DailyPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanningComplete?: () => void;
}

export function DailyPlanningModal({
  isOpen,
  onClose,
  onPlanningComplete,
}: DailyPlanningModalProps) {
  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskEstimates, setTaskEstimates] = useState<Record<string, number>>({});
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsDone(false);
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [tasksRes, habitsRes, eventsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/habits'),
        fetch(`/api/events?startDate=${todayStr}T00:00:00&endDate=${todayStr}T23:59:59`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const allTasks: Task[] = data.tasks || [];
        setTasks(allTasks);

        const initialSelected = allTasks
          .filter((t) => t.status !== 'done' && (t.dueDate === todayStr || t.priority === 1))
          .map((t) => t.id);
        setSelectedTaskIds(initialSelected);

        const initialEst: Record<string, number> = {};
        allTasks.forEach((t) => {
          initialEst[t.id] = t.estimatedMinutes || 30;
        });
        setTaskEstimates(initialEst);
      }

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        setHabits(data.habits || []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error loading planning data:', err);
    }
  };

  if (!isOpen) return null;

  const workHoursMinutes = 8 * 60; // 8-hour workday (480 mins)
  const meetingMinutes = events.reduce((acc, ev) => {
    if (ev.isAllDay) return acc;
    const s = new Date(ev.startTime).getTime();
    const e = new Date(ev.endTime).getTime();
    return acc + Math.round((e - s) / (1000 * 60));
  }, 0);

  const availableWorkMinutes = Math.max(0, workHoursMinutes - meetingMinutes);
  const totalEstimatedMinutes = selectedTaskIds.reduce(
    (acc, id) => acc + (taskEstimates[id] || 30),
    0
  );
  const capacityPercent = availableWorkMinutes > 0 ? Math.round((totalEstimatedMinutes / availableWorkMinutes) * 100) : 100;
  const isOverloaded = totalEstimatedMinutes > availableWorkMinutes;

  const toggleTaskSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleEstimateChange = (id: string, mins: number) => {
    setTaskEstimates((prev) => ({ ...prev, [id]: Math.max(5, mins) }));
  };

  const handleFinalizeSchedule = async () => {
    setIsScheduling(true);
    try {
      for (const id of selectedTaskIds) {
        const mins = taskEstimates[id] || 30;
        await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estimatedMinutes: mins, dueDate: todayStr }),
        });
      }

      await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayDate: todayStr,
          taskIds: selectedTaskIds,
        }),
      });

      sounds.playComplete();
      setIsDone(true);
      if (onPlanningComplete) onPlanningComplete();
    } catch (err) {
      console.error('Error auto-scheduling:', err);
    } finally {
      setIsScheduling(false);
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
          <span>Salir</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181B] text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#059669]" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[#18181B]">
            Planificación Diaria
          </h2>
        </div>

        <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          Paso {step} de 4
        </span>
      </div>

      {/* Step Progress Bar */}
      <div className="h-1 w-full bg-slate-200 shrink-0">
        <div
          className="h-full bg-[#18181B] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Screen Body */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-4 pb-28">
        {/* STEP 1: Overview */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paso 1</span>
              <h3 className="text-sm font-bold text-[#18181B] mt-0.5">
                Panorama de tu día
              </h3>
              <p className="mt-1 text-xs text-[#475569]">
                Tienes <strong className="text-[#18181B]">{tasks.filter((t) => t.status !== 'done').length} tareas</strong> pendientes en tu lista y <strong className="text-[#18181B]">{events.length} compromisos fijados</strong> para hoy.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Eventos y reuniones programadas:
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center rounded-xl bg-slate-50 border border-slate-100">
                  No tienes reuniones fijas hoy. Tienes toda la jornada disponible para tus tareas.
                </p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/70">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="font-semibold text-[#18181B] truncate">{ev.title}</span>
                    </div>
                    <span className="font-mono text-slate-600 text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 ml-2">
                      {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Review Habits */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#ecfdf5] p-5 border border-[#a7f3d0] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669]">Paso 2</span>
              <h3 className="text-sm font-bold text-[#059669] mt-0.5">
                Hábitos diarios a cultivar
              </h3>
              <p className="mt-1 text-xs text-slate-700">
                Mantén la constancia con tus hábitos clave programados para hoy:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {habits.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669] shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#18181B] block truncate">{h.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{h.category}</span>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold text-[#059669] border border-[#a7f3d0] shrink-0">
                    {h.streak} días racha
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Select Tasks & Estimates */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paso 3</span>
              <h3 className="text-sm font-bold text-[#18181B] mt-0.5">
                Selecciona qué tareas harás hoy
              </h3>
              <p className="mt-1 text-xs text-[#475569]">
                Has seleccionado <strong className="text-[#18181B]">{selectedTaskIds.length} tareas</strong>. Toca para incluir o quitar y ajusta los minutos estimados:
              </p>
            </div>

            <div className="space-y-2.5">
              {tasks
                .filter((t) => t.status !== 'done')
                .map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const currentEst = taskEstimates[task.id] || 30;
                  const pMeta = getPriorityLabel(task.priority);

                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl p-4 text-xs border transition-all ${
                        isSelected
                          ? 'bg-white border-[#18181B] shadow-xs'
                          : 'bg-white/70 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          onClick={() => toggleTaskSelect(task.id)}
                          className="flex items-center space-x-3 cursor-pointer truncate flex-1"
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                          )}
                          <span className="font-bold text-[#18181B] truncate text-xs sm:text-sm">
                            {task.title}
                          </span>
                        </div>

                        <span className={`shrink-0 rounded-lg px-2.5 py-0.5 text-[10px] font-bold border ml-2 ${pMeta.bg} ${pMeta.color} ${pMeta.border}`}>
                          {pMeta.label}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium text-[11px]">¿Cuánto tiempo tomará?</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[15, 30, 45, 60, 90].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleEstimateChange(task.id, m)}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                  currentEst === m
                                    ? 'bg-[#18181B] text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* STEP 4: Capacity & Auto-Schedule */}
        {step === 4 && (
          <div className="space-y-4">
            {!isDone ? (
              <>
                <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paso 4</span>
                      <h3 className="text-sm font-bold text-[#18181B]">
                        Balance de tu Jornada
                      </h3>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 self-start sm:self-auto">
                      {formatMinutes(totalEstimatedMinutes)} de {formatMinutes(availableWorkMinutes)} libres
                    </span>
                  </div>

                  {/* Capacity Meter */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                      <span>Tiempo ocupado vs libre</span>
                      <span className={isOverloaded ? 'text-rose-700 font-bold' : 'text-[#18181B] font-semibold'}>
                        {capacityPercent}% de tu tiempo disponible
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverloaded
                            ? 'bg-rose-500'
                            : capacityPercent > 85
                            ? 'bg-amber-500'
                            : 'bg-[#059669]'
                        }`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      />
                    </div>
                  </div>

                  {isOverloaded && (
                    <div className="flex items-start space-x-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>
                        <strong>Atención:</strong> Has programado {formatMinutes(totalEstimatedMinutes)} para {formatMinutes(availableWorkMinutes)} disponibles. Te sugerimos desmarcar alguna tarea para evitar sobrecarga.
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 p-5 bg-white shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                    Resumen del plan para hoy:
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-center space-x-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0" />
                      <span><strong>{selectedTaskIds.length} tareas</strong> seleccionadas con tiempo estimado</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0" />
                      <span><strong>{events.length} reuniones</strong> protegidas sin solapamientos</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0" />
                      <span>Ubicación inteligente en los bloques libres de tu calendario</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="py-12 text-center space-y-4 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#059669] shadow-xs border border-[#a7f3d0]">
                  <Check className="h-8 w-8 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#18181B]">
                    ¡Tu día está organizado!
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                    Las tareas han sido ubicadas en bloques de tiempo en tu calendario. Puedes iniciar tu primera sesión de enfoque cuando gustes.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation Controls */}
      <div className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between shrink-0">
        {!isDone ? (
          <>
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-slate-200 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs active:scale-95"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isScheduling || selectedTaskIds.length === 0}
                onClick={handleFinalizeSchedule}
                className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                <span>{isScheduling ? 'Organizando...' : 'Auto-Ubicar en Calendario'}</span>
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#18181B] py-3 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition-colors"
          >
            Cerrar y Ver mi Agenda
          </button>
        )}
      </div>
    </div>
  );
}

