'use client';

import React, { useState } from 'react';
import { Task, CalendarEvent, Project } from '@/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Move,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  parseISO,
  addMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { formatMinutes, getPriorityLabel } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface CalendarViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  projects: Project[];
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onRefreshData: () => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

export function CalendarView({
  tasks,
  events,
  projects,
  onUpdateTask,
  onSelectTask,
  onRefreshData,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('09:00');
  const [newEventEnd, setNewEventEnd] = useState('10:00');
  const [newEventColor, setNewEventColor] = useState('#3b82f6');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

  const unscheduledTasks = tasks.filter(
    (t) => t.status !== 'done' && !t.scheduledStart
  );

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate((d) => subDays(d, 1));
    else setCurrentDate((d) => subDays(d, 7));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate((d) => addDays(d, 1));
    else setCurrentDate((d) => addDays(d, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragStartTask = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnHour = async (e: React.DragEvent, targetDateStr: string, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const duration = task.estimatedMinutes || 30;
    const startTime = `${targetDateStr}T${String(hour).padStart(2, '0')}:00:00`;
    const startDateObj = parseISO(startTime);
    const endDateObj = addMinutes(startDateObj, duration);
    const endTime = endDateObj.toISOString();

    sounds.playComplete();

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledStart: startDateObj.toISOString(),
          scheduledEnd: endTime,
          dueDate: targetDateStr,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTask(data.task);
      }
    } catch (err) {
      console.error('Error time-blocking task:', err);
    }
  };

  const handleAutoSchedule = async () => {
    setIsAutoScheduling(true);
    try {
      const res = await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayDate: currentDateStr }),
      });

      if (res.ok) {
        sounds.playComplete();
        onRefreshData();
      }
    } catch (err) {
      console.error('Error running auto-schedule:', err);
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      const startIso = `${currentDateStr}T${newEventStart}:00`;
      const endIso = `${currentDateStr}T${newEventEnd}:00`;

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          startTime: startIso,
          endTime: endIso,
          color: newEventColor,
        }),
      });

      if (res.ok) {
        setShowEventModal(false);
        setNewEventTitle('');
        onRefreshData();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-xs font-semibold text-zinc-900 capitalize">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
          </h2>
        </div>

        {/* View mode switcher & Action Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
            {(['day', 'week'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {mode === 'day' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Auto-Schedule Button */}
          <button
            onClick={handleAutoSchedule}
            disabled={isAutoScheduling}
            className="flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Ubicar tareas pendientes automáticamente"
          >
            <span>{isAutoScheduling ? 'Organizando...' : 'Auto-Organizar'}</span>
          </button>

          {/* Add Event Button */}
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center space-x-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Evento</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar Timeline + Unscheduled Backlog Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Timeline View */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm overflow-x-auto">
          {viewMode === 'day' ? (
            <div className="min-w-[400px]">
              <div className="space-y-1">
                {HOURS.map((hour) => {
                  const hourFormatted = `${String(hour).padStart(2, '0')}:00`;

                  const hourEvents = events.filter((ev) => {
                    const evStart = new Date(ev.startTime);
                    const evDateStr = format(evStart, 'yyyy-MM-dd');
                    return evDateStr === currentDateStr && evStart.getHours() === hour;
                  });

                  const hourTasks = tasks.filter((t) => {
                    if (!t.scheduledStart) return false;
                    const tStart = new Date(t.scheduledStart);
                    const tDateStr = format(tStart, 'yyyy-MM-dd');
                    return tDateStr === currentDateStr && tStart.getHours() === hour;
                  });

                  return (
                    <div
                      key={hour}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnHour(e, currentDateStr, hour)}
                      className="group flex min-h-[56px] border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors rounded-lg p-1"
                    >
                      <div className="w-14 shrink-0 text-[11px] font-mono font-medium text-zinc-400 pt-1">
                        {hourFormatted}
                      </div>

                      <div className="flex-1 space-y-1 pl-2">
                        {hourEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-white shadow-sm"
                            style={{ backgroundColor: ev.color || '#3b82f6' }}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <CalendarIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{ev.title}</span>
                            </div>
                            <span className="font-mono text-[10px] opacity-90 shrink-0">
                              {format(new Date(ev.startTime), 'HH:mm')} - {format(new Date(ev.endTime), 'HH:mm')}
                            </span>
                          </div>
                        ))}

                        {hourTasks.map((t) => {
                          const priorityMeta = getPriorityLabel(t.priority);
                          const isDone = t.status === 'done';

                          return (
                            <div
                              key={t.id}
                              onClick={() => onSelectTask(t)}
                              className={`flex items-center justify-between rounded-lg border p-2 text-xs cursor-pointer shadow-sm transition-all hover:border-zinc-400 ${
                                isDone
                                  ? 'bg-zinc-100 border-zinc-200 text-zinc-400'
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className={`h-1.5 w-1.5 rounded-full ${isDone ? 'bg-zinc-400' : 'bg-zinc-900'}`} />
                                <span className={`font-medium truncate ${isDone ? 'line-through' : ''}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="font-mono text-[10px] text-zinc-500">
                                  {t.scheduledStart && format(new Date(t.scheduledStart), 'HH:mm')} ({formatMinutes(t.estimatedMinutes || 30)})
                                </span>
                                <span className={`rounded px-1 text-[9px] font-medium border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}>
                                  P{t.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isCurrent = isToday(day);
                const dayTasks = tasks.filter((t) => t.dueDate === dayStr || (t.scheduledStart && t.scheduledStart.startsWith(dayStr)));
                const dayEvents = events.filter((e) => e.startTime.startsWith(dayStr));

                return (
                  <div
                    key={dayStr}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnHour(e, dayStr, 9)}
                    className={`flex flex-col rounded-xl border p-2 min-h-[340px] ${
                      isCurrent
                        ? 'border-zinc-400 bg-zinc-50/70'
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="text-center pb-1.5 border-b border-zinc-100">
                      <span className="text-[10px] font-medium uppercase text-zinc-400">
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <h4 className={`text-xs font-semibold ${isCurrent ? 'text-zinc-950 font-bold' : 'text-zinc-700'}`}>
                        {format(day, 'd')}
                      </h4>
                    </div>

                    <div className="mt-1.5 flex-1 space-y-1 overflow-y-auto">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded p-1 text-[10px] font-medium text-white truncate"
                          style={{ backgroundColor: ev.color || '#3b82f6' }}
                        >
                          {ev.title}
                        </div>
                      ))}

                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="rounded bg-zinc-50 p-1 text-[10px] font-medium text-zinc-800 border border-zinc-200 truncate cursor-pointer hover:border-zinc-400"
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Backlog Sidebar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Backlog por Agendar
              </h3>
              <p className="text-[10px] text-zinc-400">
                Arrastra al calendario para asignar hora
              </p>
            </div>
            <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-700">
              {unscheduledTasks.length}
            </span>
          </div>

          <div className="mt-2.5 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {unscheduledTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400 italic">
                No hay tareas pendientes sin agendar
              </p>
            ) : (
              unscheduledTasks.map((task) => {
                const priorityMeta = getPriorityLabel(task.priority);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStartTask(e, task.id)}
                    onClick={() => onSelectTask(task)}
                    className="group rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs cursor-grab active:cursor-grabbing hover:border-zinc-400 hover:bg-white transition-all"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-zinc-900 truncate">
                        {task.title}
                      </span>
                      <span className={`shrink-0 rounded px-1 text-[9px] font-medium border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}>
                        P{task.priority}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatMinutes(task.estimatedMinutes || 30)}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="h-3 w-3" />
                        <span>Arrastrar</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">
              Nuevo Evento de Calendario
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-zinc-500 uppercase">Título</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ej: Reunión de sincronización..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-zinc-500 uppercase">Inicio</label>
                  <input
                    type="time"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-500 uppercase">Fin</label>
                  <input
                    type="time"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-zinc-500 uppercase">Color</label>
                <div className="mt-1 flex items-center space-x-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewEventColor(c)}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${
                        newEventColor === c ? 'scale-110 border-zinc-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
                >
                  Crear Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
