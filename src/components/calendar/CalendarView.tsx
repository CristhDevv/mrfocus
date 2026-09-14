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
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('09:00');
  const [newEventEnd, setNewEventEnd] = useState('10:00');
  const [newEventColor, setNewEventColor] = useState('#18181B');
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
        setShowEventForm(false);
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between sm:justify-start space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#18181B] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-xs sm:text-sm font-bold text-[#18181B] capitalize truncate pl-1">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
          </h2>
        </div>

        {/* View mode switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 sm:p-1">
            {(['day', 'week'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#475569] hover:text-[#18181B]'
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
            className="flex items-center space-x-1.5 rounded-lg bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]"
            title="Ubicar tareas pendientes automáticamente"
          >
            <span>{isAutoScheduling ? 'Organizando...' : 'Auto-Organizar'}</span>
          </button>

          {/* Add Event Button */}
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              showEventForm
                ? 'bg-slate-200 text-slate-900'
                : 'border border-slate-200 bg-white text-[#18181B] hover:bg-slate-50'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showEventForm ? 'Cancelar' : 'Evento'}</span>
          </button>
        </div>
      </div>

      {/* Inline New Event Form (Zero Modals!) */}
      {showEventForm && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-in fade-in duration-150 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#18181B]">
              Nuevo Evento de Calendario
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Horario y detalles del compromiso</span>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Título del evento
              </label>
              <input
                type="text"
                required
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Ej: Reunión con cliente, Clase de inglés..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={newEventStart}
                  onChange={(e) => setNewEventStart(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={newEventEnd}
                  onChange={(e) => setNewEventEnd(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Color distintivo
              </label>
              <div className="mt-2 flex items-center space-x-2.5">
                {[
                  { hex: '#18181B', label: 'Grafito' },
                  { hex: '#059669', label: 'Esmeralda' },
                  { hex: '#0284c7', label: 'Azul' },
                  { hex: '#d97706', label: 'Ámbar' },
                  { hex: '#e11d48', label: 'Rojo' },
                ].map((item) => (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => setNewEventColor(item.hex)}
                    className={`h-8 w-8 rounded-xl border-2 transition-all ${
                      newEventColor === item.hex ? 'scale-110 border-slate-900 shadow-xs' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: item.hex }}
                    title={item.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEventForm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newEventTitle.trim()}
                className="rounded-xl bg-[#18181B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                Guardar Evento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Calendar Timeline + Unscheduled Backlog Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full max-w-full">
        {/* Timeline View */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs w-full max-w-full overflow-hidden">
          {viewMode === 'day' ? (
            <div className="w-full min-w-0">
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
                      className="group flex min-h-[54px] border-b border-slate-100 hover:bg-[#F8FAFC] transition-colors rounded-lg p-1 sm:p-1.5"
                    >
                      <div className="w-11 sm:w-14 shrink-0 text-[11px] sm:text-xs font-semibold text-slate-400 pt-1">
                        {hourFormatted}
                      </div>

                      <div className="flex-1 space-y-1.5 pl-1.5 sm:pl-2 min-w-0">
                        {hourEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-transform hover:scale-[1.005]"
                            style={{
                              backgroundColor: ev.color || '#18181B',
                              color: '#ffffff',
                            }}
                          >
                            <div className="flex items-center space-x-1.5 truncate min-w-0 mr-2">
                              <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span className="truncate">{ev.title}</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-medium opacity-90 shrink-0">
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
                              className={`flex items-center justify-between rounded-lg border p-2 sm:p-2.5 text-xs cursor-pointer shadow-2xs transition-all hover:border-slate-300 ${
                                isDone
                                  ? 'bg-[#F8FAFC] border-slate-200 text-slate-400'
                                  : 'bg-white border-slate-200 text-[#18181B] hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate min-w-0 mr-2">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${isDone ? 'bg-[#059669]' : 'bg-[#18181B]'}`} />
                                <span className={`font-semibold truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                                  {t.scheduledStart && format(new Date(t.scheduledStart), 'HH:mm')} ({formatMinutes(t.estimatedMinutes || 30)})
                                </span>
                                <span className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}>
                                  {priorityMeta.label}
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
            <div className="w-full">
              {/* Mobile: Stacked 7-day Agenda List (Zero Horizontal Scroll) */}
              <div className="sm:hidden space-y-2.5 w-full">
                {weekDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurrent = isToday(day);
                  const dayTasks = tasks.filter((t) => t.dueDate === dayStr || (t.scheduledStart && t.scheduledStart.startsWith(dayStr)));
                  const dayEvents = events.filter((e) => e.startTime.startsWith(dayStr));

                  return (
                    <div
                      key={dayStr}
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrent ? 'border-[#18181B] bg-slate-50 shadow-2xs' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-[#18181B] capitalize">
                          {format(day, 'EEEE, d MMM', { locale: es })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {dayEvents.length + dayTasks.length} compromisos
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {dayEvents.length === 0 && dayTasks.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-1">Sin eventos ni tareas</p>
                        ) : (
                          <>
                            {dayEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="rounded-lg p-2 text-xs font-semibold text-white truncate"
                                style={{ backgroundColor: ev.color || '#18181B' }}
                              >
                                {ev.title} ({format(new Date(ev.startTime), 'HH:mm')} - {format(new Date(ev.endTime), 'HH:mm')})
                              </div>
                            ))}
                            {dayTasks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTask(t)}
                                className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-[#18181B] border border-slate-200 truncate cursor-pointer hover:bg-white"
                              >
                                {t.title}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet/Desktop: 7 Columns Grid */}
              <div className="hidden sm:grid sm:grid-cols-7 gap-2 w-full">
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
                      className={`flex flex-col rounded-xl border p-2.5 min-h-[360px] transition-all ${
                        isCurrent
                          ? 'border-[#18181B] bg-slate-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center pb-2 border-b border-slate-100">
                        <span className="text-[11px] font-bold uppercase text-slate-400">
                          {format(day, 'EEE', { locale: es })}
                        </span>
                        <h4 className={`text-sm font-bold mt-0.5 ${isCurrent ? 'text-[#18181B]' : 'text-slate-700'}`}>
                          {format(day, 'd')}
                        </h4>
                      </div>

                      <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-lg p-1.5 text-[11px] font-semibold truncate text-white shadow-2xs"
                            style={{ backgroundColor: ev.color || '#18181B' }}
                          >
                            {ev.title}
                          </div>
                        ))}

                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className="rounded-lg bg-slate-50 p-1.5 text-[11px] font-medium text-[#18181B] border border-slate-200 truncate cursor-pointer hover:border-slate-300 hover:bg-white transition-all shadow-2xs"
                          >
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Backlog Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                Por Agendar
              </h3>
              <p className="text-[11px] text-slate-400">
                Arrastra al calendario para asignar hora
              </p>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {unscheduledTasks.length}
            </span>
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {unscheduledTasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">
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
                    className="group rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-xs cursor-grab active:cursor-grabbing hover:border-slate-300 hover:bg-white hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[#18181B] truncate">
                        {task.title}
                      </span>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}>
                        {priorityMeta.label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#475569] font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatMinutes(task.estimatedMinutes || 30)}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-[#059669] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
