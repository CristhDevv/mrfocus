'use client';

import React, { useState, useEffect } from 'react';
import { PomodoroFullView } from '@/components/pomodoro/PomodoroFullView';
import { Task } from '@/types';
import { Timer } from 'lucide-react';

export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/tasks?status=todo')
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 flex items-center space-x-2">
          <Timer className="h-5 w-5 text-zinc-800" />
          <span>Sesión de Enfoque (Pomodoro)</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Trabaja en bloques de tiempo continuos vinculados a tus tareas
        </p>
      </div>

      <PomodoroFullView tasks={tasks} />
    </div>
  );
}
