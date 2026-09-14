'use client';

import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { TaskCard } from './TaskCard';
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Folder,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
}

export function TaskListView({
  tasks,
  projects,
  onUpdateTask,
  onSelectTask,
  onDeleteTask,
}: TaskListViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'backlog' | 'completed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const next7DaysStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) {
      return false;
    }

    if (selectedPriority !== 'all' && t.priority !== parseInt(selectedPriority, 10)) {
      return false;
    }

    if (filterTab === 'today') {
      return t.status !== 'done' && t.dueDate === todayStr;
    }
    if (filterTab === 'upcoming') {
      return t.status !== 'done' && t.dueDate && t.dueDate > todayStr && t.dueDate <= next7DaysStr;
    }
    if (filterTab === 'backlog') {
      return t.status !== 'done' && !t.dueDate;
    }
    if (filterTab === 'completed') {
      return t.status === 'done';
    }

    return true;
  });

  // Group filtered tasks for 'all' or active tab
  const overdueTasks = filteredTasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
  );
  const todayTasks = filteredTasks.filter(
    (t) => t.status !== 'done' && t.dueDate === todayStr
  );
  const upcomingTasks = filteredTasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate > todayStr
  );
  const backlogTasks = filteredTasks.filter(
    (t) => t.status !== 'done' && !t.dueDate
  );
  const completedTasks = filteredTasks.filter((t) => t.status === 'done');

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const renderSection = (title: string, count: number, sectionTasks: Task[], id: string, icon: React.ReactNode, badgeColor: string) => {
    if (sectionTasks.length === 0) return null;
    const isCollapsed = Boolean(collapsedSections[id]);

    return (
      <div key={id} className="space-y-1.5">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="flex w-full items-center justify-between rounded-lg py-1.5 px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />}
            {icon}
            <span className="uppercase tracking-wider">{title}</span>
            <span className={`rounded px-1.5 py-0.2 text-[10px] ${badgeColor}`}>
              {count}
            </span>
          </div>
        </button>

        {!isCollapsed && (
          <div className="space-y-1.5 pl-1">
            {sectionTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                project={t.projectId ? projectMap.get(t.projectId) : undefined}
                onUpdateTask={onUpdateTask}
                onSelectTask={onSelectTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todas', count: tasks.length },
            { id: 'today', label: 'Hoy', count: tasks.filter((t) => t.status !== 'done' && t.dueDate === todayStr).length },
            { id: 'upcoming', label: 'Próximos 7d', count: tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate > todayStr && t.dueDate <= next7DaysStr).length },
            { id: 'backlog', label: 'Bandeja', count: tasks.filter((t) => t.status !== 'done' && !t.dueDate).length },
            { id: 'completed', label: 'Completadas', count: tasks.filter((t) => t.status === 'done').length },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-200/70 text-zinc-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Project and Priority dropdown filters */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-400"
          >
            <option value="all">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-400"
          >
            <option value="all">Prioridad (Todas)</option>
            <option value="1">P1 Urgente</option>
            <option value="2">P2 Alta</option>
            <option value="3">P3 Media</option>
            <option value="4">P4 Baja</option>
          </select>
        </div>
      </div>

      {/* Task Sections List */}
      <div className="space-y-4">
        {filterTab === 'all' ? (
          <>
            {renderSection('Vencidas', overdueTasks.length, overdueTasks, 'overdue', <AlertTriangle className="h-3.5 w-3.5 text-red-500" />, 'bg-red-50 text-red-600 border border-red-100')}
            {renderSection('Hoy', todayTasks.length, todayTasks, 'today', <Calendar className="h-3.5 w-3.5 text-zinc-700" />, 'bg-zinc-100 text-zinc-800')}
            {renderSection('Próximas', upcomingTasks.length, upcomingTasks, 'upcoming', <Clock className="h-3.5 w-3.5 text-zinc-500" />, 'bg-zinc-100 text-zinc-700')}
            {renderSection('Bandeja / Backlog', backlogTasks.length, backlogTasks, 'backlog', <Inbox className="h-3.5 w-3.5 text-zinc-400" />, 'bg-zinc-100 text-zinc-600')}
            {renderSection('Completadas', completedTasks.length, completedTasks, 'completed', <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />, 'bg-emerald-50 text-emerald-700 border border-emerald-100')}
          </>
        ) : (
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center bg-white">
                <Inbox className="mx-auto h-7 w-7 text-zinc-400" />
                <p className="mt-2 text-xs font-medium text-zinc-600">
                  No hay tareas en esta vista.
                </p>
              </div>
            ) : (
              filteredTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  project={t.projectId ? projectMap.get(t.projectId) : undefined}
                  onUpdateTask={onUpdateTask}
                  onSelectTask={onSelectTask}
                  onDeleteTask={onDeleteTask}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
