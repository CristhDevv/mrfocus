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
  Clock,
  Calendar,
  Folder,
  Tag,
  AlertCircle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              Detalles de la Tarea
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea..."
              className="w-full text-lg font-bold text-[#18181B] placeholder:text-slate-300 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción o detalles adicionales..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-xs sm:text-sm text-[#18181B] placeholder:text-slate-400 focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          {/* Core Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Project */}
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <Folder className="h-3 w-3 text-slate-500" />
                <span>Proyecto</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              >
                <option value="">(Sin proyecto)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector - Friendly Text */}
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 text-slate-500" />
                <span>Prioridad</span>
              </label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {([1, 2, 3, 4] as Priority[]).map((p) => {
                  const meta = getPriorityLabel(p);
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-lg py-2 px-1 text-[11px] font-bold border transition-all text-center ${
                        isSelected
                          ? `${meta.bg} ${meta.color} ${meta.border} shadow-2xs`
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              >
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Tiempo Estimado (minutos)</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            {/* Due Date & Time */}
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Fecha Límite</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Hora Límite</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              />
            </div>
          </div>

          {/* Recurrence & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                Recurrencia (ej. diario, mensual)
              </label>
              <input
                type="text"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="diario, semanal, mensual..."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
                <Tag className="h-3 w-3 text-slate-400" />
                <span>Etiquetas (separadas por coma)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="frontend, diseño, reporte..."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B]"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
            <h4 className="text-xs font-bold text-[#18181B]">
              Subtareas ({subtasks.filter((s) => s.completed).length} de {subtasks.length} listas)
            </h4>

            <div className="mt-3 space-y-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-slate-200 shadow-2xs"
                >
                  <div
                    onClick={() => toggleSubtask(st.id)}
                    className="flex items-center space-x-2.5 cursor-pointer flex-1"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className={st.completed ? 'line-through text-slate-400 font-normal' : 'text-[#18181B] font-medium'}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="mt-3 flex items-center space-x-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Escribe una subtarea y presiona Enter..."
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#18181B] p-2 text-white hover:bg-slate-800 shadow-xs"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider flex items-center space-x-1">
              <FileText className="h-3 w-3 text-slate-500" />
              <span>Notas de la tarea</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe apuntes, links o ideas relacionadas..."
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-xs text-[#18181B] focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2.5 border-t border-slate-100 bg-[#F8FAFC] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!title.trim() || isSaving}
            onClick={handleSave}
            className="flex items-center space-x-1.5 rounded-lg bg-[#18181B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
