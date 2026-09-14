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
        <h1 className="text-xl font-extrabold text-[#18181B] flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#18181B]">
            <Timer className="h-4 w-4" />
          </div>
          <span>Sesión de Enfoque (Pomodoro)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Trabaja en bloques de tiempo continuos vinculados a tus tareas
        </p>
      </div>

      <PomodoroFullView tasks={tasks} />
    </div>
  );
}
