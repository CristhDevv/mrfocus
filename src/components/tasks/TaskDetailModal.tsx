'use client';

import React, { useState, useEffect } from 'react';
import { Task, Project, Subtask, Priority, TaskStatus } from '@/types';
import {
  ArrowLeft,
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
  X,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-y-auto animate-in fade-in duration-100">
      {/* Native Mobile Top Navigation Bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <h2 className="text-xs sm:text-sm font-bold text-[#18181B] truncate max-w-[150px] sm:max-w-xs">
          Detalles de la Tarea
        </h2>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDelete}
            className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            title="Eliminar tarea"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!title.trim() || isSaving}
            onClick={handleSave}
            className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-4 pb-20">
        {/* Title & Description Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Título de la tarea
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe el nombre de la tarea..."
              className="w-full text-base sm:text-lg font-bold text-[#18181B] placeholder:text-slate-300 focus:outline-none mt-1 border-b border-slate-100 pb-2"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Descripción o detalles
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agrega notas o contexto adicional..."
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs sm:text-sm text-[#18181B] placeholder:text-slate-400 focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>
        </div>

        {/* Core Properties Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          {/* Priority Selector */}
          <div>
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Prioridad</span>
            </label>
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
              {([1, 2, 3, 4] as Priority[]).map((p) => {
                const meta = getPriorityLabel(p);
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-xl py-2 px-1 text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? `${meta.bg} ${meta.color} ${meta.border} shadow-2xs scale-102`
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
                <Folder className="h-3.5 w-3.5 text-slate-500" />
                <span>Proyecto</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              >
                <option value="">(Sin proyecto)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              >
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Estimated Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Fecha Límite</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Hora Límite</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Estimado (min)</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              />
            </div>
          </div>

          {/* Recurrence & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Recurrencia
              </label>
              <input
                type="text"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="diario, semanal, mensual..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <span>Etiquetas</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="frontend, diseño, reporte..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
              Subtareas ({subtasks.filter((s) => s.completed).length} de {subtasks.length} listas)
            </h4>
          </div>

          <div className="space-y-2">
            {subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/80"
              >
                <div
                  onClick={() => toggleSubtask(st.id)}
                  className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                >
                  {st.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={`truncate font-medium ${st.completed ? 'line-through text-slate-400' : 'text-[#18181B]'}`}>
                    {st.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSubtask(st.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                  aria-label="Eliminar subtarea"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Nueva subtarea..."
              className="flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-xs text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B]"
            />
            <button
              type="submit"
              className="flex items-center space-x-1 rounded-xl bg-[#18181B] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Añadir</span>
            </button>
          </form>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2">
          <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Notas de la tarea</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe apuntes, enlaces o detalles adicionales..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs sm:text-sm text-[#18181B] focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
          />
        </div>
      </div>
    </div>
  );
}

