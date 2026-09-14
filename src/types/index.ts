export type Priority = 1 | 2 | 3 | 4;

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  recurrenceRule?: string; // e.g., 'daily', 'weekly', 'monthly', 'monthly:1', 'weekdays'
  subtasks: Subtask[];
  scheduledStart?: string; // ISO String
  scheduledEnd?: string; // ISO String
  notes?: string;
  createdAt: string;
  completedAt?: string;
  orderIndex: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  taskCount?: number;
  completedTaskCount?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAllDay?: boolean;
  color?: string;
  category?: string;
  location?: string;
  projectId?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  targetDaysPerWeek?: number;
  streak: number;
  bestStreak: number;
  createdAt: string;
  completedDates: string[]; // List of 'YYYY-MM-DD'
}

export interface TimeSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  type: 'pomodoro' | 'stopwatch' | 'manual';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  notes?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  taskId?: string;
  projectId?: string;
  tags: string[];
  isPinned?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompleted: number;
}

export interface ParsedNLPTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  recurrenceRule?: string;
  priority?: Priority;
  estimatedMinutes?: number;
  projectId?: string;
  projectName?: string;
  tags: string[];
}
