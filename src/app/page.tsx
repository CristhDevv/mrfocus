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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {format(today, 'EEEE, d MMMM yyyy', { locale: es })}
          </span>
          <h1 className="text-xl font-semibold text-zinc-900 mt-0.5">
            Vista del Día — {pendingTodayTasks.length} pendientes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {completedTodayTasks.length} completadas hoy • {events.length} eventos programados
          </p>
        </div>

        {/* Morning Planning Action */}
        <button
          onClick={() => setIsPlanningModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95 shrink-0"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Planificación Diaria</span>
        </button>
      </div>

      {/* Quick NLP Task Capture Bar */}
      <div>
        <QuickCaptureBar
          onTaskCreated={(newTask) => {
            setTasks([newTask, ...tasks]);
            loadDashboardData();
          }}
        />
      </div>

      {/* Habits Today Check-in Strip */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-zinc-700" />
            <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
              Hábitos de Hoy
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            {habits.filter((h) => h.completedDates.includes(todayStr)).length}/{habits.length} completados
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {habits.map((habit) => {
            const isCompleted = habit.completedDates.includes(todayStr);
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => handleToggleHabit(habit.id)}
                className={`flex items-center space-x-2.5 rounded-lg border p-2.5 text-left transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    ICONS_MAP[habit.icon] || <Activity className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-xs font-medium truncate ${
                      isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900'
                    }`}
                  >
                    {habit.name}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {habit.streak} días racha
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Left Today's Tasks, Right Today's Time-Blocked Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tasks for Today */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center space-x-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-600" />
              <span>Tareas para Hoy ({pendingTodayTasks.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center bg-white">
                <Calendar className="mx-auto h-7 w-7 text-zinc-400" />
                <p className="mt-2 text-xs font-medium text-zinc-700">
                  No hay tareas programadas para hoy
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
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
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-600" />
              <span>Bloques de Tiempo Hoy</span>
            </h3>
          </div>

          <div className="space-y-2">
            {timelineItems.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">
                No hay bloques de tiempo asignados. Usa el Calendario para ubicar tareas.
              </p>
            ) : (
              timelineItems.map((item, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  className="flex items-start space-x-2.5 rounded-lg bg-zinc-50 p-2.5 text-xs border border-zinc-100"
                >
                  <div className="flex flex-col items-center shrink-0 w-11 font-mono text-[10px] text-zinc-500">
                    <span>{format(new Date(item.startTime), 'HH:mm')}</span>
                    <span className="text-zinc-300">|</span>
                    <span>{format(new Date(item.endTime), 'HH:mm')}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-zinc-900 truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">
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
