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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Planificación Diaria Guiada
              </h2>
              <p className="text-[11px] text-zinc-500">
                Paso {step} de 4 • Organiza tu jornada con time-blocking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {/* STEP 1: Overview */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200">
                <h3 className="text-xs font-semibold text-zinc-900">
                  1. Punto de partida de hoy
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Tienes <strong className="text-zinc-900">{tasks.filter((t) => t.status !== 'done').length} tareas</strong> pendientes en el backlog y <strong className="text-zinc-900">{events.length} eventos fijados</strong> para hoy.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Eventos y reuniones programadas:
                </h4>
                {events.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">No hay eventos fijos hoy. Tienes la jornada disponible.</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 text-xs border border-zinc-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-medium text-zinc-800">{ev.title}</span>
                      </div>
                      <span className="font-mono text-zinc-500 text-[11px]">
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
              <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200">
                <h3 className="text-xs font-semibold text-zinc-900">
                  2. Hábitos clave
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Verifica los hábitos programados para mantener la consistencia:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {habits.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 border border-zinc-100">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-3.5 w-3.5 text-zinc-600" />
                      <div>
                        <span className="text-xs font-medium text-zinc-900">{h.name}</span>
                        <span className="block text-[10px] text-zinc-400">{h.category}</span>
                      </div>
                    </div>
                    <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                      {h.streak}d racha
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Select Tasks & Estimates */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200">
                <h3 className="text-xs font-semibold text-zinc-900">
                  3. Selección de tareas y estimación de tiempo
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Seleccionadas: <strong>{selectedTaskIds.length} tareas</strong>. Ajusta los minutos necesarios por cada tarea:
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.status !== 'done')
                  .map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const currentEst = taskEstimates[task.id] || 30;
                    const pMeta = getPriorityLabel(task.priority);

                    return (
                      <div
                        key={task.id}
                        className={`rounded-lg p-2.5 text-xs border transition-all ${
                          isSelected
                            ? 'bg-zinc-50 border-zinc-400'
                            : 'bg-white border-zinc-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => toggleTaskSelect(task.id)}
                            className="flex items-center space-x-2.5 cursor-pointer truncate flex-1"
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-zinc-900 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-zinc-400 shrink-0" />
                            )}
                            <span className="font-medium text-zinc-900 truncate">
                              {task.title}
                            </span>
                          </div>

                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border ${pMeta.bg} ${pMeta.color} ${pMeta.border}`}>
                            P{task.priority}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Estimación:</span>
                            <div className="flex items-center space-x-1">
                              {[15, 30, 45, 60, 90].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => handleEstimateChange(task.id, m)}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                                    currentEst === m
                                      ? 'bg-zinc-900 text-white'
                                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
                  <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                        4. Validación de Capacidad del Día
                      </h3>
                      <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                        {formatMinutes(totalEstimatedMinutes)} / {formatMinutes(availableWorkMinutes)} disponibles
                      </span>
                    </div>

                    {/* Capacity Meter */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                        <span>Carga estimada</span>
                        <span className={isOverloaded ? 'text-red-600 font-semibold' : 'text-zinc-900 font-medium'}>
                          {capacityPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverloaded
                              ? 'bg-red-500'
                              : capacityPercent > 85
                              ? 'bg-amber-500'
                              : 'bg-zinc-900'
                          }`}
                          style={{ width: `${Math.min(100, capacityPercent)}%` }}
                        />
                      </div>
                    </div>

                    {isOverloaded && (
                      <div className="mt-3 flex items-start space-x-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                        <span>
                          <strong>Alerta de sobrecarga:</strong> Has programado {formatMinutes(totalEstimatedMinutes)} para un total de {formatMinutes(availableWorkMinutes)} libres.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-zinc-200 p-3.5 bg-white">
                    <h4 className="text-xs font-semibold text-zinc-800">
                      Resumen de Time-Blocking:
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-zinc-600">
                      <li className="flex items-center space-x-2">
                        <Check className="h-3.5 w-3.5 text-zinc-700" />
                        <span>{selectedTaskIds.length} tareas seleccionadas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="h-3.5 w-3.5 text-zinc-700" />
                        <span>{events.length} reuniones protegidas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="h-3.5 w-3.5 text-zinc-700" />
                        <span>El algoritmo ubicará las tareas en los huecos libres respetando prioridades</span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">
                      Planificación Diaria Completada
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Tus tareas han sido organizadas en los bloques de tiempo del calendario de hoy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          {!isDone ? (
            <>
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isScheduling || selectedTaskIds.length === 0}
                  onClick={handleFinalizeSchedule}
                  className="flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <span>{isScheduling ? 'Programando...' : 'Auto-Ubicar en Calendario'}</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-zinc-900 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Cerrar y Ver Agenda
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
