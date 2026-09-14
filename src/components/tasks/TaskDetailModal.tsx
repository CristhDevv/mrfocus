'use client';

import React, { useState, useEffect } from 'react';
import { Task, Project, Subtask, Priority, TaskStatus } from '@/types';
import {
  X,
  Trash2,
  Save,
  Plus,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react';
import { getPriorityLabel } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  projects,
  onClose,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>(4);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.projectId || '');
      setPriority(task.priority || 4);
      setStatus(task.status || 'todo');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEstimatedMinutes(task.estimatedMinutes || 30);
      setRecurrenceRule(task.recurrenceRule || '');
      setTagsInput(task.tags ? task.tags.join(', ') : '');
      setSubtasks(task.subtasks || []);
      setNotes(task.notes || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      projectId: projectId || null,
      priority,
      status,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      estimatedMinutes,
      recurrenceRule: recurrenceRule.trim() || null,
      tags: parsedTags,
      subtasks,
      notes: notes.trim() || null,
    };

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTask(data.task);
        onClose();
      }
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSt: Subtask = {
      id: `st_${Date.now()}`,
      taskId: task.id,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (stId: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === stId ? { ...st, completed: !st.completed } : st))
    );
  };

  const removeSubtask = (stId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== stId));
  };

  const handleDelete = async () => {
    if (confirm('¿Deseas eliminar esta tarea?')) {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
        if (res.ok) {
          onDeleteTask(task.id);
          onClose();
        }
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Detalle de Tarea
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea..."
              className="w-full text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción o detalles..."
              rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Core Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Project */}
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Proyecto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              >
                <option value="">(Sin proyecto)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Prioridad
              </label>
              <div className="mt-1 flex items-center space-x-1">
                {([1, 2, 3, 4] as Priority[]).map((p) => {
                  const meta = getPriorityLabel(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium border transition-all ${
                        priority === p
                          ? `${meta.bg} ${meta.color} ${meta.border}`
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      P{p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              >
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Tiempo Estimado (min)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Due Date & Time */}
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Hora Límite
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Recurrence & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Recurrencia (ej. daily, monthly:1)
              </label>
              <input
                type="text"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="daily, weekly..."
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dev, frontend, pagos..."
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="rounded-xl border border-zinc-200 p-3.5">
            <h4 className="text-xs font-semibold text-zinc-700">
              Subtareas ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </h4>

            <div className="mt-2.5 space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-xs border border-zinc-100"
                >
                  <div
                    onClick={() => toggleSubtask(st.id)}
                    className="flex items-center space-x-2 cursor-pointer flex-1"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className={st.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubtask(st.id)}
                    className="text-zinc-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="mt-2.5 flex items-center space-x-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Añadir subtarea..."
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-200 p-1.5 text-zinc-700 hover:bg-zinc-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>Notas de la tarea (Markdown)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-mono text-zinc-800 focus:border-zinc-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!title.trim() || isSaving}
            onClick={handleSave}
            className="flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
