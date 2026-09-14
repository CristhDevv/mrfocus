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
  ChevronLeft,
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
          <div key={idx} className="flex items-center space-x-2 my-1 text-xs text-slate-400 line-through">
            <span className="h-4 w-4 rounded-md bg-[#059669] text-white flex items-center justify-center text-[10px]">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span>{line.replace(/- \[[xX]\] /, '')}</span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} className="flex items-center space-x-2 my-1 text-xs text-slate-700">
            <span className="h-4 w-4 rounded-md border border-slate-300 inline-block bg-white" />
            <span>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-slate-700 my-0.5 list-disc">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-[#18181B] pl-3 italic text-xs text-slate-600 my-2 bg-slate-50 py-1 rounded-r-lg">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-700 min-h-[1em] my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
      {/* Sidebar: Notes List */}
      <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex-col ${
        activeNoteId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#18181B]">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
              Mis Notas ({notes.length})
            </h3>
          </div>
          <button
            onClick={handleCreateNote}
            className="flex items-center space-x-1 rounded-xl bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#27272a] transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3 mb-2">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en mis notas..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#18181B]/10 focus:border-[#18181B] transition-all"
          />
        </div>

        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[440px]">
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center font-medium">
              No hay notas para mostrar.
            </p>
          ) : (
            filteredNotes.map((note) => {
              const isActive = activeNoteId === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`group rounded-xl border p-3 cursor-pointer transition-all ${
                    isActive
                      ? 'border-[#18181B] bg-slate-50 shadow-xs'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-[#18181B] truncate flex-1 pr-2">
                      {note.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Eliminar nota"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {note.content.replace(/[#*>\-[\]]/g, '').trim()}
                  </p>
                  <span className="mt-2 block text-[10px] font-medium text-slate-400">
                    {note.updatedAt && format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor & Live Markdown Preview */}
      <div className={`md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex-col ${
        activeNoteId ? 'flex' : 'hidden md:flex'
      }`}>
        {activeNoteId ? (
          <>
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveNoteId(null)}
                  className="md:hidden flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 shrink-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Notas</span>
                </button>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la nota..."
                  className="text-sm sm:text-base font-bold text-[#18181B] focus:outline-none bg-transparent flex-1 min-w-0"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    previewMode
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={previewMode ? 'Modo edición' : 'Vista previa'}
                >
                  {previewMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{previewMode ? 'Editar' : 'Vista Previa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#27272a] transition-all disabled:opacity-50 active:scale-95"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="flex-1 mt-3">
              {previewMode ? (
                <div className="rounded-xl bg-slate-50/70 p-3.5 sm:p-4 min-h-[340px] overflow-y-auto border border-slate-100">
                  {renderMarkdown(content)}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe en formato simple o Markdown (# Encabezado, - [ ] Checkbox)..."
                  className="w-full h-full min-h-[340px] text-xs sm:text-sm leading-relaxed text-[#18181B] bg-transparent p-1 sm:p-2 focus:outline-none resize-none font-sans"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs font-medium text-slate-400 py-16">
            Selecciona o crea una nota para comenzar a escribir.
          </div>
        )}
      </div>
    </div>
  );
}
