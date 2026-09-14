import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Task, Subtask } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown> | undefined;

    if (!taskRow) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const subtaskRows = db.prepare(`SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index ASC`).all(id) as Array<{
      id: string;
      task_id: string;
      title: string;
      completed: number;
    }>;

    const task: Task = {
      id: taskRow.id as string,
      title: taskRow.title as string,
      description: (taskRow.description as string) || undefined,
      projectId: (taskRow.project_id as string) || undefined,
      priority: taskRow.priority as Task['priority'],
      status: taskRow.status as Task['status'],
      dueDate: (taskRow.due_date as string) || undefined,
      dueTime: (taskRow.due_time as string) || undefined,
      estimatedMinutes: (taskRow.estimated_minutes as number) || 30,
      actualMinutes: (taskRow.actual_minutes as number) || 0,
      tags: taskRow.tags ? JSON.parse(taskRow.tags as string) : [],
      recurrenceRule: (taskRow.recurrence_rule as string) || undefined,
      subtasks: subtaskRows.map((st) => ({
        id: st.id,
        taskId: st.task_id,
        title: st.title,
        completed: Boolean(st.completed),
      })),
      scheduledStart: (taskRow.scheduled_start as string) || undefined,
      scheduledEnd: (taskRow.scheduled_end as string) || undefined,
      notes: (taskRow.notes as string) || undefined,
      createdAt: taskRow.created_at as string,
      completedAt: (taskRow.completed_at as string) || undefined,
      orderIndex: (taskRow.order_index as number) || 0,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      projectId: 'project_id',
      priority: 'priority',
      status: 'status',
      dueDate: 'due_date',
      dueTime: 'due_time',
      estimatedMinutes: 'estimated_minutes',
      actualMinutes: 'actual_minutes',
      recurrenceRule: 'recurrence_rule',
      scheduledStart: 'scheduled_start',
      scheduledEnd: 'scheduled_end',
      notes: 'notes',
      orderIndex: 'order_index',
    };

    Object.keys(fieldMap).forEach((key) => {
      if (body[key] !== undefined) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(body[key]);
      }
    });

    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }

    if (body.status !== undefined) {
      if (body.status === 'done' && existing.status !== 'done') {
        const completedAt = new Date().toISOString();
        updates.push('completed_at = ?');
        values.push(completedAt);
      } else if (body.status !== 'done') {
        updates.push('completed_at = ?');
        values.push(null);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (body.subtasks !== undefined && Array.isArray(body.subtasks)) {
      db.prepare(`DELETE FROM subtasks WHERE task_id = ?`).run(id);
      const insertSubtask = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, order_index)
        VALUES (?, ?, ?, ?, ?)
      `);
      body.subtasks.forEach((st: { id?: string; title: string; completed?: boolean }, idx: number) => {
        const stId = st.id || `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertSubtask.run(stId, id, st.title, st.completed ? 1 : 0, idx);
      });
    }

    const updated = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown>;
    const subtaskRows = db.prepare(`SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index ASC`).all(id) as Array<{
      id: string;
      task_id: string;
      title: string;
      completed: number;
    }>;

    const task: Task = {
      id: updated.id as string,
      title: updated.title as string,
      description: (updated.description as string) || undefined,
      projectId: (updated.project_id as string) || undefined,
      priority: updated.priority as Task['priority'],
      status: updated.status as Task['status'],
      dueDate: (updated.due_date as string) || undefined,
      dueTime: (updated.due_time as string) || undefined,
      estimatedMinutes: (updated.estimated_minutes as number) || 30,
      actualMinutes: (updated.actual_minutes as number) || 0,
      tags: updated.tags ? JSON.parse(updated.tags as string) : [],
      recurrenceRule: (updated.recurrence_rule as string) || undefined,
      subtasks: subtaskRows.map((st) => ({
        id: st.id,
        taskId: st.task_id,
        title: st.title,
        completed: Boolean(st.completed),
      })),
      scheduledStart: (updated.scheduled_start as string) || undefined,
      scheduledEnd: (updated.scheduled_end as string) || undefined,
      notes: (updated.notes as string) || undefined,
      createdAt: updated.created_at as string,
      completedAt: (updated.completed_at as string) || undefined,
      orderIndex: (updated.order_index as number) || 0,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    db.prepare(`DELETE FROM subtasks WHERE task_id = ?`).run(id);
    const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
