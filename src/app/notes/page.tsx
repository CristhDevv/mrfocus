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
        <h1 className="text-xl font-semibold text-zinc-900 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-zinc-800" />
          <span>Notas Rápidas</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Editor Markdown ligero y bloc de notas vinculado a tareas y proyectos
        </p>
      </div>

      <NotesView initialNotes={notes} projects={projects} tasks={tasks} />
    </div>
  );
}
