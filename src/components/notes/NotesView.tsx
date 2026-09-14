'use client';

import React, { useState, useEffect } from 'react';
import { Note, Project, Task } from '@/types';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Search,
  Eye,
  Edit3,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

interface NotesViewProps {
  initialNotes?: Note[];
  projects?: Project[];
  tasks?: Task[];
}

export function NotesView({
  initialNotes = [],
  projects = [],
  tasks = [],
}: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    initialNotes.length > 0 ? initialNotes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        const fetchedNotes: Note[] = data.notes || [];
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0 && !activeNoteId) {
          selectNote(fetchedNotes[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  const selectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSelectedProjectId(note.projectId || '');
    setSelectedTaskId(note.taskId || '');
  };

  const handleCreateNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nueva Nota',
          content: '# Título de la nota\n\n- [ ] Primer punto clave\n- [ ] Segundo punto',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        selectNote(data.note);
      }
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNoteId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/${activeNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Sin título',
          content,
          projectId: selectedProjectId || null,
          taskId: selectedTaskId || null,
        }),
      });

      if (res.ok) {
        setNotes(
          notes.map((n) =>
            n.id === activeNoteId
              ? {
                  ...n,
                  title: title.trim() || 'Sin título',
                  content,
                  projectId: selectedProjectId || undefined,
                  taskId: selectedTaskId || undefined,
                  updatedAt: new Date().toISOString(),
                }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('¿Eliminar esta nota?')) {
      try {
        const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          const updated = notes.filter((n) => n.id !== id);
          setNotes(updated);
          if (activeNoteId === id) {
            if (updated.length > 0) {
              selectNote(updated[0]);
            } else {
              setActiveNoteId(null);
              setTitle('');
              setContent('');
            }
          }
        }
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-base font-semibold text-zinc-900 my-2">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-sm font-semibold text-zinc-900 my-1.5">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xs font-semibold text-zinc-800 my-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        return (
          <div key={idx} className="flex items-center space-x-2 my-1 text-xs text-zinc-400 line-through">
            <span className="h-3.5 w-3.5 rounded bg-zinc-900 text-white flex items-center justify-center text-[10px]">
              <Check className="h-2.5 w-2.5" />
            </span>
            <span>{line.replace(/- \[[xX]\] /, '')}</span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} className="flex items-center space-x-2 my-1 text-xs text-zinc-800">
            <span className="h-3.5 w-3.5 rounded border border-zinc-300 inline-block bg-white" />
            <span>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-zinc-700 my-0.5 list-disc">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-zinc-400 pl-3 italic text-xs text-zinc-600 my-2">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      return (
        <p key={idx} className="text-xs text-zinc-700 min-h-[1em] my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[540px]">
      {/* Sidebar: Notes List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-zinc-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Notas Rápidas
            </h3>
          </div>
          <button
            onClick={handleCreateNote}
            className="flex items-center space-x-1 rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-2.5 mb-2">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-2.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* List */}
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 max-h-[440px]">
          {filteredNotes.map((note) => {
            const isActive = activeNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group rounded-lg border p-2.5 cursor-pointer transition-all ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-medium text-zinc-900 truncate flex-1">
                    {note.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                  {note.content.replace(/[#*>\-[\]]/g, '').trim()}
                </p>
                <span className="mt-1.5 block text-[9px] text-zinc-400">
                  {note.updatedAt && format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Live Markdown Preview */}
      <div className="md:col-span-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col">
        {activeNoteId ? (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota..."
                className="text-sm font-semibold text-zinc-900 focus:outline-none bg-transparent flex-1 mr-3"
              />

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    previewMode
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                  title={previewMode ? 'Modo edición' : 'Vista previa Markdown'}
                >
                  {previewMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{previewMode ? 'Editar' : 'Vista Previa'}</span>
                </button>

                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="flex items-center space-x-1 rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="flex-1 mt-3">
              {previewMode ? (
                <div className="rounded-lg bg-zinc-50/60 p-3.5 min-h-[380px] overflow-y-auto border border-zinc-100">
                  {renderMarkdown(content)}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe en Markdown (# Encabezado, - [ ] Checkbox, etc.)..."
                  className="w-full h-full min-h-[380px] font-mono text-xs text-zinc-800 bg-transparent p-1 focus:outline-none resize-none"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-400 italic">
            Selecciona o crea una nota para comenzar a escribir.
          </div>
        )}
      </div>
    </div>
  );
}
