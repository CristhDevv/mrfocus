'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseNaturalLanguageTask } from '@/lib/nlp-parser';
import { Project, ParsedNLPTask, Task } from '@/types';
import { sounds } from '@/lib/audio';
import {
  Calendar,
  Clock,
  Repeat,
  AlertCircle,
  Folder,
  Tag,
  Hourglass,
  ArrowRight,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import { getPriorityLabel } from '@/lib/utils';

interface QuickCaptureBarProps {
  onTaskCreated?: (task: Task) => void;
  autoFocus?: boolean;
  compact?: boolean;
}

export function QuickCaptureBar({
  onTaskCreated,
  autoFocus = false,
  compact = false,
}: QuickCaptureBarProps) {
  const [input, setInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [parsed, setParsed] = useState<ParsedNLPTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (input.trim().length > 0) {
      const res = parseNaturalLanguageTask(input, projects);
      setParsed(res);
    } else {
      setParsed(null);
    }
  }, [input, projects]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguageText: input }),
      });

      if (res.ok) {
        const data = await res.json();
        sounds.playComplete();
        setInput('');
        setParsed(null);
        setJustCreated(true);
        setTimeout(() => setJustCreated(false), 2000);
        if (onTaskCreated) onTaskCreated(data.task);
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const appendChip = (text: string) => {
    setInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text}` : text;
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const priorityMeta = parsed?.priority ? getPriorityLabel(parsed.priority) : null;

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-card">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 mr-2.5">
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='¿Qué tienes pendiente? Ej: "Llamar a Carlos mañana a las 3pm" o "Revisar facturas hoy"'
          className="w-full rounded-lg bg-[#F8FAFC] py-2.5 pl-3 pr-28 text-xs sm:text-sm font-medium text-[#18181B] placeholder:text-slate-400 border border-slate-200 focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="absolute right-1.5 flex items-center space-x-1.5 rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-slate-800 disabled:opacity-40 active:scale-95"
        >
          {justCreated ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#059669]" />
              <span className="text-[#059669]">Guardada</span>
            </>
          ) : (
            <>
              <span>Guardar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Live NLP Parsed Tokens Preview - Human friendly */}
      {parsed && input.trim().length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-[#059669]" />
            <span>Detectado:</span>
          </span>

          {parsed.dueDate && (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span>Fecha: {parsed.dueDate}</span>
            </span>
          )}

          {parsed.dueTime && (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>Hora: {parsed.dueTime}</span>
            </span>
          )}

          {parsed.recurrenceRule && (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-[#ecfdf5] px-2.5 py-1 text-xs font-medium text-[#059669] border border-[#a7f3d0]">
              <Repeat className="h-3 w-3 text-[#059669]" />
              <span>Repetir: {parsed.recurrenceRule}</span>
            </span>
          )}

          {priorityMeta && (
            <span
              className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${priorityMeta.color} ${priorityMeta.bg} ${priorityMeta.border}`}
            >
              <AlertCircle className="h-3 w-3" />
              <span>Prioridad: {priorityMeta.label}</span>
            </span>
          )}

          {parsed.projectName && (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Folder className="h-3 w-3 text-slate-500" />
              <span>Proyecto: {parsed.projectName}</span>
            </span>
          )}

          {parsed.estimatedMinutes && (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Hourglass className="h-3 w-3 text-slate-500" />
              <span>Duración: {parsed.estimatedMinutes} min</span>
            </span>
          )}

          {parsed.tags.map((t) => (
            <span key={t} className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
              <Tag className="h-2.5 w-2.5 opacity-60" />
              <span>{t}</span>
            </span>
          ))}
        </div>
      )}

      {/* Friendly helper chips */}
      {!compact && !input && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#475569]">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Opciones rápidas:</span>
          <button
            type="button"
            onClick={() => appendChip('hoy')}
            className="rounded-lg bg-slate-100 px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Para hoy
          </button>
          <button
            type="button"
            onClick={() => appendChip('mañana')}
            className="rounded-lg bg-slate-100 px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Para mañana
          </button>
          <button
            type="button"
            onClick={() => appendChip('urgente')}
            className="rounded-lg bg-rose-50 px-2.5 py-1 hover:bg-rose-100 text-rose-700 font-medium border border-rose-100 transition-colors"
          >
            Urgente
          </button>
          <button
            type="button"
            onClick={() => appendChip('30 min')}
            className="rounded-lg bg-slate-100 px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            30 min
          </button>
          <button
            type="button"
            onClick={() => appendChip('cada dia')}
            className="rounded-lg bg-[#ecfdf5] px-2.5 py-1 hover:bg-[#d1fae5] text-[#059669] font-medium border border-[#a7f3d0] transition-colors"
          >
            Repetir diario
          </button>
        </div>
      )}
    </div>
  );
}
