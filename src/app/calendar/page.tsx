'use client';

import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, Project } from '@/types';
import { CalendarView } from '@/components/calendar/CalendarView';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      const [tasksRes, eventsRes, projectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/events'),
        fetch('/api/projects'),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-zinc-800" />
          <span>Calendario & Time-Blocking</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Programa bloques de tiempo, organiza eventos y utiliza auto-scheduling
        </p>
      </div>

      <CalendarView
        tasks={tasks}
        events={events}
        projects={projects}
        onUpdateTask={handleUpdateTask}
        onSelectTask={(task) => {
          setSelectedTask(task);
          setIsDetailModalOpen(true);
        }}
        onRefreshData={loadCalendarData}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        projects={projects}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
