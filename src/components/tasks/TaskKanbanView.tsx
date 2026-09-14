'use client';

import React, { useState } from 'react';
import { Task, Project, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { sounds } from '@/lib/audio';

interface TaskKanbanViewProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; dot: string; headerBg: string }[] = [
  { id: 'todo', title: 'Por Hacer', color: 'text-[#18181B]', dot: 'bg-slate-400', headerBg: 'bg-slate-100' },
  { id: 'in_progress', title: 'En Progreso', color: 'text-[#18181B]', dot: 'bg-sky-500', headerBg: 'bg-sky-50 border border-sky-100' },
  { id: 'review', title: 'En Revisión', color: 'text-[#18181B]', dot: 'bg-amber-500', headerBg: 'bg-amber-50 border border-amber-100' },
  { id: 'done', title: 'Completadas', color: 'text-[#059669]', dot: 'bg-[#059669]', headerBg: 'bg-[#ecfdf5] border border-[#a7f3d0]' },
];

export function TaskKanbanView({
  tasks,
  projects,
  onUpdateTask,
  onSelectTask,
  onDeleteTask,
}: TaskKanbanViewProps) {
  const [selectedMobileCol, setSelectedMobileCol] = useState<'all' | TaskStatus>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    if (targetStatus === 'done') {
      sounds.playComplete();
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTask(data.task);
      }
    } catch (err) {
      console.error('Error updating task in Kanban:', err);
    }
  };

  const visibleColumns = COLUMNS.filter((col) => {
    if (selectedMobileCol === 'all') return true;
    return col.id === selectedMobileCol;
  });

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Mobile Column Quick Selector */}
      <div className="sm:hidden flex flex-wrap items-center gap-1.5 w-full">
        <button
          type="button"
          onClick={() => setSelectedMobileCol('all')}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            selectedMobileCol === 'all'
              ? 'bg-[#18181B] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-slate-200'
          }`}
        >
          Todas las Columnas
        </button>
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => (t.status || 'todo') === col.id).length;
          const isSelected = selectedMobileCol === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedMobileCol(col.id)}
              className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white text-[#475569] border border-slate-200'
              }`}
            >
              <span>{col.title}</span>
              <span className={`rounded-md px-1 py-0.2 text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-6 w-full max-w-full">
        {visibleColumns.map((col) => {
          const columnTasks = tasks.filter((t) => (t.status || 'todo') === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3.5 min-h-[300px] sm:min-h-[520px] w-full"
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${col.headerBg}`}>
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className={`text-xs font-bold tracking-wide ${col.color}`}>
                    {col.title}
                  </h3>
                </div>
                <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-2xs border border-slate-100">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Task Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <TaskCard
                      task={task}
                      project={task.projectId ? projectMap.get(task.projectId) : undefined}
                      onUpdateTask={onUpdateTask}
                      onSelectTask={onSelectTask}
                      onDeleteTask={onDeleteTask}
                      compact={true}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
                    No hay tareas en esta columna
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

