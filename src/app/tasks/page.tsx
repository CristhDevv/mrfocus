'use client';

import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { QuickCaptureBar } from '@/components/quick-capture/QuickCaptureBar';
import {
  List,
  Kanban,
  CheckSquare,
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadTasks();
    const handleRefresh = () => loadTasks();
    window.addEventListener('mrfocus_refresh_tasks', handleRefresh);
    return () => window.removeEventListener('mrfocus_refresh_tasks', handleRefresh);
  }, []);

  const loadTasks = async () => {
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
      console.error('Error loading tasks:', err);
    }
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#18181B] flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span>Gestión de Tareas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Organiza tus tareas y proyectos en Vista de Lista o Tablero Kanban
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Tablero Kanban</span>
          </button>
        </div>
      </div>

      {/* Quick Capture Input */}
      <QuickCaptureBar
        onTaskCreated={(newTask) => setTasks([newTask, ...tasks])}
      />

      {/* Main View: List or Kanban */}
      {viewMode === 'list' ? (
        <TaskListView
          tasks={tasks}
          projects={projects}
          onUpdateTask={handleUpdateTask}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDetailModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <TaskKanbanView
          tasks={tasks}
          projects={projects}
          onUpdateTask={handleUpdateTask}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setIsDetailModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
        />
      )}

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
