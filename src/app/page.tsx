'use client';

import React, { useState, useEffect } from 'react';
import { Task, Project, Habit, CalendarEvent } from '@/types';
import { QuickCaptureBar } from '@/components/quick-capture/QuickCaptureBar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { DailyPlanningModal } from '@/components/daily-planning/DailyPlanningModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  Activity,
  BookOpen,
  Sun,
  Layers,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sounds } from '@/lib/audio';

const ICONS_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-4 w-4 text-zinc-700" />,
  Activity: <Activity className="h-4 w-4 text-zinc-700" />,
  Sun: <Sun className="h-4 w-4 text-zinc-700" />,
  Calendar: <Calendar className="h-4 w-4 text-zinc-700" />,
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    loadDashboardData();

    const handleRefresh = () => loadDashboardData();
    window.addEventListener('mrfocus_refresh_tasks', handleRefresh);
    return () => window.removeEventListener('mrfocus_refresh_tasks', handleRefresh);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tasksRes, projectsRes, habitsRes, eventsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/habits'),
        fetch(`/api/events?startDate=${todayStr}T00:00:00&endDate=${todayStr}T23:59:59`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
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
      console.error('Error loading dashboard data:', err);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    loadDashboardData();
  };

  const handleDeleteTask = (deletedId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedId));
  };

  const handleToggleHabit = async (habitId: string) => {
    sounds.playComplete();
    try {
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const todayTasks = tasks.filter(
    (t) => t.dueDate === todayStr || (t.scheduledStart && t.scheduledStart.startsWith(todayStr))
  );

  const pendingTodayTasks = todayTasks.filter((t) => t.status !== 'done');
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'done');

  const scheduledTasks = tasks.filter(
    (t) => t.scheduledStart && t.scheduledStart.startsWith(todayStr)
  );

  const timelineItems = [
    ...events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      startTime: ev.startTime,
      endTime: ev.endTime,
      isEvent: true,
      color: ev.color || '#3b82f6',
    })),
    ...scheduledTasks.map((st) => ({
      id: st.id,
      title: st.title,
      startTime: st.scheduledStart!,
      endTime: st.scheduledEnd!,
      isEvent: false,
      priority: st.priority,
      status: st.status,
      color: '#10b981',
      task: st,
    })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {format(today, 'EEEE, d MMMM yyyy', { locale: es })}
          </span>
          <h1 className="text-xl font-extrabold text-[#18181B] mt-1">
            Resumen de Hoy — {pendingTodayTasks.length} {pendingTodayTasks.length === 1 ? 'pendiente' : 'pendientes'}
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {completedTodayTasks.length} completadas hoy • {events.length} eventos programados
          </p>
        </div>

        {/* Morning Planning Action */}
        <button
          onClick={() => setIsPlanningModalOpen(true)}
          className="flex items-center space-x-2 rounded-xl bg-[#18181B] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#27272a] active:scale-95 shrink-0"
        >
          <Calendar className="h-4 w-4" />
          <span>Planificación Diaria</span>
        </button>
      </div>

      {/* Quick NLP Task Capture Bar */}
      <div>
        <QuickCaptureBar
          defaultDueDate={todayStr}
          onTaskCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
            loadDashboardData();
          }}
        />
      </div>

      {/* Habits Today Check-in Strip */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#18181B]">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
              Hábitos de Hoy
            </h3>
          </div>
          <span className="rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]/60 px-2.5 py-0.5 text-xs font-bold text-[#059669]">
            {habits.filter((h) => h.completedDates.includes(todayStr)).length}/{habits.length} completados
          </span>
        </div>

        {habits.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400 font-medium py-3 text-center">
            No tienes hábitos registrados. Ve a la sección de Hábitos para agregar tus rutinas.
          </p>
        ) : (
          <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {habits.map((habit) => {
              const isCompleted = habit.completedDates?.includes(todayStr) ?? false;
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`flex items-center space-x-3 rounded-xl border p-3 text-left transition-all ${
                    isCompleted
                      ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#18181B] shadow-2xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isCompleted ? 'bg-[#059669] text-white shadow-xs' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    ) : (
                      ICONS_MAP[habit.icon] || <Activity className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-xs font-bold truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-[#18181B]'
                      }`}
                    >
                      {habit.name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {habit.streak} días racha
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout: Left Today's Tasks, Right Today's Time-Blocked Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tasks for Today */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[#18181B]" />
              <span>Tareas para Hoy ({pendingTodayTasks.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#18181B]">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xs font-bold text-[#18181B]">
                  No hay tareas programadas para hoy
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Usa la Planificación Diaria para organizar tu jornada o añade una tarea arriba.
                </p>
              </div>
            ) : (
              todayTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  project={t.projectId ? projectMap.get(t.projectId) : undefined}
                  onUpdateTask={handleUpdateTask}
                  onSelectTask={(task) => {
                    setSelectedTask(task);
                    setIsDetailModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Today's Schedule Timeline */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
              <Clock className="h-4 w-4 text-[#18181B]" />
              <span>Bloques de Tiempo Hoy</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {timelineItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">
                No hay bloques de tiempo asignados. Usa el Calendario para ubicar tareas.
              </p>
            ) : (
              timelineItems.map((item, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  className="flex items-start space-x-3 rounded-xl bg-slate-50/70 p-3 text-xs border border-slate-100"
                >
                  <div className="flex flex-col items-center shrink-0 w-12 font-medium text-[11px] text-slate-500">
                    <span>{format(new Date(item.startTime), 'HH:mm')}</span>
                    <span className="text-slate-300">|</span>
                    <span>{format(new Date(item.endTime), 'HH:mm')}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || '#18181B' }}
                      />
                      <span className="font-bold text-[#18181B] truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="mt-1 block text-[11px] font-medium text-slate-400">
                      {item.isEvent ? 'Evento de Calendario' : 'Bloque de Tarea'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        projects={projects}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Daily Planning Modal */}
      <DailyPlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        onPlanningComplete={() => loadDashboardData()}
      />
    </div>
  );
}
