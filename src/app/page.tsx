'use client';

import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { QuickCaptureBar } from '@/components/quick-capture/QuickCaptureBar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

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
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    loadDashboardData();
  };

  const handleDeleteTask = (deletedId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedId));
  };

  // Filter tasks that belong to today (due today, overdue/past due pending tasks, or scheduled for today)
  const todayTasks = tasks.filter((t) => {
    if (t.dueDate === todayStr) return true;
    if (t.scheduledStart && t.scheduledStart.startsWith(todayStr)) return true;
    // Also include overdue pending tasks so the user sees everything needing action today
    if (t.status !== 'done' && t.dueDate && t.dueDate < todayStr) return true;
    return false;
  });

  const pendingTodayTasks = todayTasks.filter((t) => t.status !== 'done');
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'done');

  const displayedTasks = todayTasks.filter((t) => {
    if (filter === 'pending') return t.status !== 'done';
    if (filter === 'completed') return t.status === 'done';
    return true;
  });

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {format(today, 'EEEE, d MMMM yyyy', { locale: es })}
        </span>
        <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight">
            Tareas de Hoy
          </h1>
          <div className="flex items-center space-x-2 text-xs font-medium text-[#475569]">
            <span className="rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-1 font-bold text-amber-700">
              {pendingTodayTasks.length} {pendingTodayTasks.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
            <span className="rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]/60 px-2.5 py-1 font-bold text-[#059669]">
              {completedTodayTasks.length} {completedTodayTasks.length === 1 ? 'completada' : 'completadas'}
            </span>
          </div>
        </div>
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

      {/* Main Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#18181B]" />
            <span>Lista del Día ({todayTasks.length})</span>
          </h2>

          {todayTasks.length > 0 && (
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  filter === 'all' ? 'bg-white text-[#18181B] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todas ({todayTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  filter === 'pending' ? 'bg-white text-[#18181B] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Pendientes ({pendingTodayTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  filter === 'completed' ? 'bg-white text-[#18181B] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hechas ({completedTodayTasks.length})
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#18181B] border-t-transparent mx-auto" />
              <p className="text-xs font-semibold text-[#475569] mt-2">Cargando tus tareas de hoy...</p>
            </div>
          ) : displayedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#18181B]">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-[#18181B]">
                {filter === 'completed'
                  ? 'No has completado tareas hoy todavía'
                  : filter === 'pending'
                  ? '¡Excelente! No tienes tareas pendientes para hoy'
                  : 'No hay tareas programadas para hoy'}
              </p>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                {filter === 'all' && 'Escribe arriba para agregar una nueva tarea rápida o importa una plantilla desde el menú de usuario.'}
              </p>
            </div>
          ) : (
            displayedTasks.map((t) => (
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
    </div>
  );
}
