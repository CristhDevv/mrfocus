'use client';

import React, { useState, useEffect } from 'react';
import { NotesView } from '@/components/notes/NotesView';
import { Note, Project, Task } from '@/types';
import { FileText } from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/tasks').then((r) => r.json()),
    ])
      .then(([notesData, projectsData, tasksData]) => {
        setNotes(notesData.notes || []);
        setProjects(projectsData.projects || []);
        setTasks(tasksData.tasks || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#18181B] flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
            <FileText className="h-4 w-4" />
          </div>
          <span>Notas Rápidas</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Editor Markdown ligero y bloc de notas vinculado a tareas y proyectos
        </p>
      </div>

      <NotesView initialNotes={notes} projects={projects} tasks={tasks} />
    </div>
  );
}
