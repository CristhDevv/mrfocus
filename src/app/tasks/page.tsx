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
          <h1 className="text-xl font-semibold text-zinc-900 flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-zinc-800" />
            <span>Gestión de Tareas</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organiza tus tareas y proyectos en Vista de Lista o Tablero Kanban
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban</span>
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
