import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { autoScheduleTasks } from '@/lib/auto-scheduler';
import { Task, CalendarEvent } from '@/types';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      dayDate = format(new Date(), 'yyyy-MM-dd'),
      taskIds, // optional array of specific task IDs to schedule.
      workStartHour = 9,
      workEndHour = 18,
    } = body;

    // Fetch existing calendar events for the day
    const eventRows = db
      .prepare(`SELECT * FROM calendar_events WHERE start_time LIKE ? OR end_time LIKE ?`)
      .all(`${dayDate}%`, `${dayDate}%`) as Array<{
      id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      is_all_day: number;
      color?: string;
      location?: string;
    }>;

    const events: CalendarEvent[] = eventRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      startTime: r.start_time,
      endTime: r.end_time,
      isAllDay: Boolean(r.is_all_day),
      color: r.color || undefined,
      location: r.location || undefined,
    }));

    // Fetch tasks to schedule
    let tasksQuery = `SELECT * FROM tasks WHERE status != 'done'`;
    const params: string[] = [];

    if (Array.isArray(taskIds) && taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      tasksQuery += ` AND id IN (${placeholders})`;
      params.push(...taskIds);
    } else {
      // By default: take tasks for today or overdue or unscheduled backlog
      tasksQuery += ` AND (due_date = ? OR due_date < ? OR due_date IS NULL)`;
      params.push(dayDate, dayDate);
    }

    const taskRows = db.prepare(tasksQuery).all(...params) as Array<{
      id: string;
      title: string;
      description?: string;
      project_id?: string;
      priority: number;
      status: string;
      due_date?: string;
      due_time?: string;
      estimated_minutes: number;
      actual_minutes: number;
      tags: string;
      recurrence_rule?: string;
      scheduled_start?: string;
      scheduled_end?: string;
      notes?: string;
      created_at: string;
      order_index: number;
    }>;

    const tasksToSchedule: Task[] = taskRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      projectId: r.project_id || undefined,
      priority: (r.priority || 4) as Task['priority'],
      status: r.status as Task['status'],
      dueDate: r.due_date || undefined,
      dueTime: r.due_time || undefined,
      estimatedMinutes: r.estimated_minutes || 30,
      actualMinutes: r.actual_minutes || 0,
      tags: r.tags ? JSON.parse(r.tags) : [],
      recurrenceRule: r.recurrence_rule || undefined,
      subtasks: [],
      scheduledStart: r.scheduled_start || undefined,
      scheduledEnd: r.scheduled_end || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      orderIndex: r.order_index,
    }));

    // Fetch already scheduled tasks for that day (excluding the ones to be re-scheduled)
    const scheduledRows = db
      .prepare(`SELECT * FROM tasks WHERE scheduled_start LIKE ? AND status != 'done'`)
      .all(`${dayDate}%`) as Array<{
      id: string;
      title: string;
      scheduled_start: string;
      scheduled_end: string;
      priority: number;
      estimated_minutes: number;
    }>;

    const existingScheduledTasks: Task[] = scheduledRows.map((r) => ({
      id: r.id,
      title: r.title,
      priority: (r.priority || 4) as Task['priority'],
      status: 'todo',
      tags: [],
      subtasks: [],
      estimatedMinutes: r.estimated_minutes,
      scheduledStart: r.scheduled_start,
      scheduledEnd: r.scheduled_end,
      createdAt: '',
      orderIndex: 0,
    }));

    // Run auto-scheduler algorithm
    const result = autoScheduleTasks(tasksToSchedule, events, existingScheduledTasks, {
      dayDate,
      workStartHour,
      workEndHour,
    });

    // Persist scheduled start/end in database for scheduled tasks
    const updateStmt = db.prepare(`UPDATE tasks SET scheduled_start = ?, scheduled_end = ? WHERE id = ?`);
    for (const t of result.scheduledTasks) {
      updateStmt.run(t.scheduledStart || null, t.scheduledEnd || null, t.id);
    }

    return NextResponse.json({
      success: true,
      dayDate,
      ...result,
    });
  } catch (error) {
    console.error('Error auto-scheduling tasks:', error);
    return NextResponse.json({ error: 'Failed to auto-schedule tasks' }, { status: 500 });
  }
}
