import { describe, it, expect } from 'vitest';
import { autoScheduleTasks } from '../auto-scheduler';
import { Task, CalendarEvent } from '@/types';

describe('Auto Scheduler Algorithm', () => {
  const baseDay = '2026-09-15';

  const mockTasks: Task[] = [
    {
      id: 'task_urgent_p1',
      title: 'Fix critical bug',
      priority: 1,
      status: 'todo',
      estimatedMinutes: 60,
      tags: [],
      subtasks: [],
      createdAt: '2026-09-15T08:00:00.000Z',
      orderIndex: 0,
    },
    {
      id: 'task_normal_p3',
      title: 'Review docs',
      priority: 3,
      status: 'todo',
      estimatedMinutes: 30,
      tags: [],
      subtasks: [],
      createdAt: '2026-09-15T08:00:00.000Z',
      orderIndex: 1,
    },
    {
      id: 'task_high_p2',
      title: 'Database migration',
      priority: 2,
      status: 'todo',
      estimatedMinutes: 45,
      tags: [],
      subtasks: [],
      createdAt: '2026-09-15T08:00:00.000Z',
      orderIndex: 2,
    },
  ];

  const mockEvents: CalendarEvent[] = [
    {
      id: 'event_daily',
      title: 'Daily Standup',
      startTime: `${baseDay}T09:00:00.000Z`,
      endTime: `${baseDay}T09:30:00.000Z`,
      isAllDay: false,
    },
    {
      id: 'event_client_meeting',
      title: 'Client Demo',
      startTime: `${baseDay}T14:00:00.000Z`,
      endTime: `${baseDay}T15:00:00.000Z`,
      isAllDay: false,
    },
  ];

  it('should prioritize tasks by priority order (P1 > P2 > P3)', () => {
    const result = autoScheduleTasks(mockTasks, [], [], {
      dayDate: baseDay,
      workStartHour: 9,
      workEndHour: 18,
      lunchDurationMinutes: 0,
      bufferMinutes: 0,
    });

    expect(result.scheduledTasks.length).toBe(3);
    expect(result.unplacedTasks.length).toBe(0);
    expect(result.scheduledTasks[0].id).toBe('task_urgent_p1');
    expect(result.scheduledTasks[1].id).toBe('task_high_p2');
    expect(result.scheduledTasks[2].id).toBe('task_normal_p3');
  });

  it('should not overlap with existing calendar events', () => {
    const result = autoScheduleTasks(mockTasks, mockEvents, [], {
      dayDate: baseDay,
      workStartHour: 9,
      workEndHour: 18,
      lunchDurationMinutes: 0,
      bufferMinutes: 5,
    });

    expect(result.scheduledTasks.length).toBe(3);

    for (const st of result.scheduledTasks) {
      const taskStart = new Date(st.scheduledStart!).getTime();
      const taskEnd = new Date(st.scheduledEnd!).getTime();

      for (const ev of mockEvents) {
        const evStart = new Date(ev.startTime).getTime();
        const evEnd = new Date(ev.endTime).getTime();

        const overlaps = taskStart < evEnd && taskEnd > evStart;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('should respect lunch break window', () => {
    const result = autoScheduleTasks(mockTasks, [], [], {
      dayDate: baseDay,
      workStartHour: 9,
      workEndHour: 18,
      lunchStartHour: 13,
      lunchDurationMinutes: 60,
      bufferMinutes: 5,
    });

    const lunchStart = new Date(`${baseDay}T13:00:00`).getTime();
    const lunchEnd = new Date(`${baseDay}T14:00:00`).getTime();

    for (const st of result.scheduledTasks) {
      const taskStart = new Date(st.scheduledStart!).getTime();
      const taskEnd = new Date(st.scheduledEnd!).getTime();

      const overlapsLunch = taskStart < lunchEnd && taskEnd > lunchStart;
      expect(overlapsLunch).toBe(false);
    }
  });

  it('should mark overloaded and unplaced tasks when time is exceeded', () => {
    const hugeTasks: Task[] = [
      {
        id: 'big_task_1',
        title: 'Huge refactor 1',
        priority: 1,
        status: 'todo',
        estimatedMinutes: 200,
        tags: [],
        subtasks: [],
        createdAt: '2026-09-15T08:00:00.000Z',
        orderIndex: 0,
      },
      {
        id: 'big_task_2',
        title: 'Huge refactor 2',
        priority: 1,
        status: 'todo',
        estimatedMinutes: 200,
        tags: [],
        subtasks: [],
        createdAt: '2026-09-15T08:00:00.000Z',
        orderIndex: 1,
      },
    ];

    const result = autoScheduleTasks(hugeTasks, [], [], {
      dayDate: baseDay,
      workStartHour: 9,
      workEndHour: 15, // 6 hours total (360 min)
      lunchStartHour: 14,
      lunchDurationMinutes: 60, // 9:00-14:00 is 300 min gap
      bufferMinutes: 0,
    });

    expect(result.scheduledTasks.length).toBe(1);
    expect(result.unplacedTasks.length).toBe(1);
    expect(result.isOverloaded).toBe(true);
  });
});
