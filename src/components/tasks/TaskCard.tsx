'use client';

import React from 'react';
import { Task, Project } from '@/types';
import { usePomodoro } from '../pomodoro/PomodoroContext';
import { sounds } from '@/lib/audio';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Play,
  ListTodo,
  Repeat,
} from 'lucide-react';
import { getPriorityLabel, formatMinutes } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  project?: Project;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  compact?: boolean;
}

export function TaskCard({
  task,
  project,
  onUpdateTask,
  onSelectTask,
  onDeleteTask,
  compact = false,
}: TaskCardProps) {
  const { setActiveTask, activeTaskId, isRunning, startTimer } = usePomodoro();
  const isCompleted = task.status === 'done';
  const priorityMeta = getPriorityLabel(task.priority);

  const toggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isCompleted ? 'todo' : 'done';

    if (newStatus === 'done') {
      sounds.playComplete();
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateTask(data.task);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTask(task.id, task.title);
    if (!isRunning) startTimer();
  };

  const isCurrentActive = activeTaskId === task.id;
  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={() => onSelectTask(task)}
      className={`group relative flex flex-col rounded-xl border p-4 transition-all cursor-pointer ${
        isCurrentActive
          ? 'border-[#18181B] bg-white shadow-card ring-1 ring-[#18181B]'
          : isCompleted
          ? 'border-slate-200 bg-[#F8FAFC] opacity-75'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and Title */}
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleComplete}
            className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
              isCompleted ? 'text-[#059669]' : 'text-slate-300 hover:text-[#059669]'
            }`}
            aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {isCompleted ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669]">
                <CheckCircle2 className="h-5 w-5 fill-[#059669] text-white" />
              </div>
            ) : (
              <Circle className="h-5 w-5 stroke-[1.75]" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-[#18181B]'
              }`}
            >
              {task.title}
            </h4>

            {task.description && !compact && (
              <p className="mt-1 line-clamp-2 text-xs text-[#475569] font-normal">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority & Focus Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleStartFocus}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              isCurrentActive
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-[#18181B] hover:text-white'
            }`}
            title="Iniciar sesión de enfoque"
          >
            <Play className="h-3 w-3 fill-current ml-0.5" />
          </button>

          <span
            className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}
          >
            {priorityMeta.label}
          </span>
        </div>
      </div>

      {/* Subtasks Progress Bar */}
      {totalSubtasks > 0 && !compact && (
        <div className="mt-3 space-y-1 bg-[#F8FAFC] p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-[#475569] font-medium">
            <span className="flex items-center space-x-1.5">
              <ListTodo className="h-3.5 w-3.5 text-slate-500" />
              <span>Subtareas</span>
            </span>
            <span>
              {completedSubtasks} de {totalSubtasks} listas
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#059669] rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#475569]">
        {project && (
          <span
            className="inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border"
            style={{
              backgroundColor: `${project.color}10`,
              borderColor: `${project.color}30`,
              color: project.color,
            }}
          >
            <span>{project.name}</span>
          </span>
        )}

        {task.dueDate && (
          <span className="inline-flex items-center space-x-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span>{task.dueDate}</span>
          </span>
        )}

        {task.recurrenceRule && (
          <span className="inline-flex items-center space-x-1 rounded-md bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-medium text-[#059669] border border-[#a7f3d0]">
            <Repeat className="h-3 w-3 text-[#059669]" />
            <span>{task.recurrenceRule}</span>
          </span>
        )}

        {task.estimatedMinutes && (
          <span className="inline-flex items-center space-x-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>{formatMinutes(task.estimatedMinutes)}</span>
          </span>
        )}

        {task.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center space-x-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium"
          >
            <Tag className="h-2.5 w-2.5 opacity-50" />
            <span>{tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
