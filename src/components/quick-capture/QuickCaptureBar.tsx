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

  const appendToken = (token: string) => {
    setInput((prev) => `${prev.trim()} ${token}`.trim());
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const priorityMeta = parsed?.priority ? getPriorityLabel(parsed.priority) : null;

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Plus className="absolute left-3 h-4 w-4 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ej: "Pagar renta cada dia 1 !p1 @finanzas ~15m #pagos" o "Revisar código mañana a las 10am"'
          className="w-full rounded-lg bg-zinc-50 py-2 pl-9 pr-24 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 border border-zinc-200/80 focus:border-zinc-400 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="absolute right-1.5 flex items-center space-x-1 rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900"
        >
          {justCreated ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Guardada</span>
            </>
          ) : (
            <>
              <span>Guardar</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </form>

      {/* Live NLP Parsed Tokens Preview */}
      {parsed && input.trim().length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 text-xs">
          <span className="text-[10px] font-medium text-zinc-400 mr-1">Detectado:</span>

          {parsed.dueDate && (
            <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <span>{parsed.dueDate}</span>
            </span>
          )}

          {parsed.dueTime && (
            <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200">
              <Clock className="h-3 w-3 text-zinc-500" />
              <span>{parsed.dueTime}</span>
            </span>
          )}

          {parsed.recurrenceRule && (
            <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200">
              <Repeat className="h-3 w-3 text-zinc-500" />
              <span>{parsed.recurrenceRule}</span>
            </span>
          )}

          {priorityMeta && (
            <span
              className={`inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-[11px] font-medium border ${priorityMeta.color} ${priorityMeta.bg} ${priorityMeta.border}`}
            >
              <AlertCircle className="h-3 w-3" />
              <span>{priorityMeta.label}</span>
            </span>
          )}

          {parsed.projectName && (
            <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200">
              <Folder className="h-3 w-3 text-zinc-500" />
              <span>@{parsed.projectName}</span>
            </span>
          )}

          {parsed.estimatedMinutes && (
            <span className="inline-flex items-center space-x-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200">
              <Hourglass className="h-3 w-3 text-zinc-500" />
              <span>{parsed.estimatedMinutes}m</span>
            </span>
          )}

          {parsed.tags.map((t) => (
            <span key={t} className="inline-flex items-center space-x-0.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700 font-medium">
              <Tag className="h-2.5 w-2.5 opacity-50" />
              <span>#{t}</span>
            </span>
          ))}
        </div>
      )}

      {/* Quick insertion helpers when input is empty */}
      {!compact && !input && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="text-[10px] text-zinc-400">Atajos:</span>
          <button onClick={() => appendToken('hoy')} className="rounded bg-zinc-100 px-1.5 py-0.5 hover:bg-zinc-200 text-zinc-700">
            + hoy
          </button>
          <button onClick={() => appendToken('mañana')} className="rounded bg-zinc-100 px-1.5 py-0.5 hover:bg-zinc-200 text-zinc-700">
            + mañana
          </button>
          <button onClick={() => appendToken('!p1')} className="rounded bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 hover:bg-red-100">
            + !p1
          </button>
          <button onClick={() => appendToken('cada dia 1')} className="rounded bg-zinc-100 px-1.5 py-0.5 hover:bg-zinc-200 text-zinc-700">
            + cada dia 1
          </button>
          <button onClick={() => appendToken('~30m')} className="rounded bg-zinc-100 px-1.5 py-0.5 hover:bg-zinc-200 text-zinc-700">
            + ~30m
          </button>
        </div>
      )}
    </div>
  );
}
