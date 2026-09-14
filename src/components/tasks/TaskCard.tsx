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
      className={`group relative flex flex-col rounded-xl border p-3.5 transition-all cursor-pointer ${
        isCurrentActive
          ? 'border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900'
          : isCompleted
          ? 'border-zinc-100 bg-zinc-50/50 opacity-60'
          : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Checkbox and Title */}
        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleComplete}
            className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
              isCompleted ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 fill-emerald-100" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-xs font-medium leading-snug break-words ${
                isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900'
              }`}
            >
              {task.title}
            </h4>

            {task.description && !compact && (
              <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority & Focus Button */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleStartFocus}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${
              isCurrentActive
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
            title="Iniciar sesión de enfoque"
          >
            <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
          </button>

          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${priorityMeta.bg} ${priorityMeta.color} ${priorityMeta.border}`}
          >
            P{task.priority}
          </span>
        </div>
      </div>

      {/* Subtasks Progress Bar */}
      {totalSubtasks > 0 && !compact && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center space-x-1">
              <ListTodo className="h-3 w-3" />
              <span>Subtareas</span>
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-zinc-700 rounded-full transition-all duration-200"
              style={{
                width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer Badges */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
        {project && (
          <span
            className="inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-[10px] font-medium border"
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
          <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
            <Calendar className="h-2.5 w-2.5 opacity-60" />
            <span>{task.dueDate}</span>
          </span>
        )}

        {task.recurrenceRule && (
          <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
            <Repeat className="h-2.5 w-2.5" />
            <span>{task.recurrenceRule}</span>
          </span>
        )}

        {task.estimatedMinutes && (
          <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
            <Clock className="h-2.5 w-2.5 opacity-60" />
            <span>{formatMinutes(task.estimatedMinutes)}</span>
          </span>
        )}

        {task.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center space-x-0.5 text-[10px] text-zinc-400"
          >
            <Tag className="h-2 w-2 opacity-50" />
            <span>{tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
