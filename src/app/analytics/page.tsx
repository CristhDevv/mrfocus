'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { TimeSession, Project, Task } from '@/types';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/time-sessions').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/tasks').then((r) => r.json()),
    ])
      .then(([sessionsData, projectsData, tasksData]) => {
        setSessions(sessionsData.sessions || []);
        setProjects(projectsData.projects || []);
        setTasks(tasksData.tasks || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsDashboard sessions={sessions} projects={projects} tasks={tasks} />
    </div>
  );
}
