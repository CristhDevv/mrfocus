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

const COLUMNS: { id: TaskStatus; title: string; color: string; dot: string }[] = [
  { id: 'todo', title: 'Por Hacer', color: 'text-zinc-700', dot: 'bg-zinc-400' },
  { id: 'in_progress', title: 'En Progreso', color: 'text-zinc-900', dot: 'bg-zinc-800' },
  { id: 'review', title: 'En Revisión', color: 'text-zinc-600', dot: 'bg-zinc-500' },
  { id: 'done', title: 'Completadas', color: 'text-emerald-700', dot: 'bg-emerald-600' },
];

export function TaskKanbanView({
  tasks,
  projects,
  onUpdateTask,
  onSelectTask,
  onDeleteTask,
}: TaskKanbanViewProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-6 overflow-x-auto">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => (t.status || 'todo') === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center space-x-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                  {col.title}
                </h3>
                <span className="rounded bg-zinc-200/70 px-1.5 py-0.2 text-[10px] font-medium text-zinc-700">
                  {columnTasks.length}
                </span>
              </div>
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
                <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400">
                  Arrastra tareas aquí
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
