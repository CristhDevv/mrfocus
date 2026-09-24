import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Task, Subtask } from '@/types';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    try {
      const { data: r } = await supabase.from('tasks').select('*').eq('id', params.id).maybeSingle();
      if (r) {
        const { data: subtasks } = await supabase.from('subtasks').select('*').eq('task_id', params.id);
        const task: Task = {
          id: r.id,
          title: r.title,
          description: r.description || undefined,
          projectId: r.project_id || undefined,
          priority: r.priority,
          status: r.status,
          dueDate: r.due_date || undefined,
          dueTime: r.due_time || undefined,
          estimatedMinutes: r.estimated_minutes,
          actualMinutes: r.actual_minutes,
          tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
          recurrenceRule: r.recurrence_rule || undefined,
          subtasks: (subtasks || []).map((st: any) => ({
            id: st.id,
            taskId: st.task_id,
            title: st.title,
            completed: Boolean(st.completed),
          })),
          scheduledStart: r.scheduled_start || undefined,
          scheduledEnd: r.scheduled_end || undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at,
          completedAt: r.completed_at || undefined,
          orderIndex: r.order_index,
        };
        return NextResponse.json({ task });
      }
    } catch {}

    const taskRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id) as any;
    if (!taskRow) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const subtaskRows = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index ASC').all(params.id) as any[];
    const subtasks: Subtask[] = subtaskRows.map((st) => ({
      id: st.id,
      taskId: st.task_id,
      title: st.title,
      completed: Boolean(st.completed),
    }));

    const task: Task = {
      id: taskRow.id,
      title: taskRow.title,
      description: taskRow.description || undefined,
      projectId: taskRow.project_id || undefined,
      priority: taskRow.priority,
      status: taskRow.status,
      dueDate: taskRow.due_date || undefined,
      dueTime: taskRow.due_time || undefined,
      estimatedMinutes: taskRow.estimated_minutes,
      actualMinutes: taskRow.actual_minutes,
      tags: taskRow.tags ? (typeof taskRow.tags === 'string' ? JSON.parse(taskRow.tags) : taskRow.tags) : [],
      recurrenceRule: taskRow.recurrence_rule || undefined,
      subtasks,
      scheduledStart: taskRow.scheduled_start || undefined,
      scheduledEnd: taskRow.scheduled_end || undefined,
      notes: taskRow.notes || undefined,
      createdAt: taskRow.created_at,
      completedAt: taskRow.completed_at || undefined,
      orderIndex: taskRow.order_index,
    };

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id) as any || {};

    const title = body.title !== undefined ? body.title : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const projectId = body.projectId !== undefined ? body.projectId : existing.project_id;
    const priority = body.priority !== undefined ? body.priority : existing.priority;
    const status = body.status !== undefined ? body.status : existing.status;
    const dueDate = body.dueDate !== undefined ? body.dueDate : existing.due_date;
    const dueTime = body.dueTime !== undefined ? body.dueTime : existing.due_time;
    const estimatedMinutes = body.estimatedMinutes !== undefined ? body.estimatedMinutes : existing.estimated_minutes;
    const actualMinutes = body.actualMinutes !== undefined ? body.actualMinutes : existing.actual_minutes;
    const tags = body.tags !== undefined ? (typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)) : existing.tags;
    const recurrenceRule = body.recurrenceRule !== undefined ? body.recurrenceRule : existing.recurrence_rule;
    const scheduledStart = body.scheduledStart !== undefined ? body.scheduledStart : existing.scheduled_start;
    const scheduledEnd = body.scheduledEnd !== undefined ? body.scheduledEnd : existing.scheduled_end;
    const notes = body.notes !== undefined ? body.notes : existing.notes;
    const completedAt = status === 'done' && existing.status !== 'done' ? new Date().toISOString() : status !== 'done' ? null : existing.completed_at;

    db.prepare(`
      UPDATE tasks SET
        title = ?, description = ?, project_id = ?, priority = ?, status = ?,
        due_date = ?, due_time = ?, estimated_minutes = ?, actual_minutes = ?,
        tags = ?, recurrence_rule = ?, scheduled_start = ?, scheduled_end = ?,
        notes = ?, completed_at = ?
      WHERE id = ?
    `).run(
      title, description, projectId, priority, status,
      dueDate, dueTime, estimatedMinutes, actualMinutes,
      tags, recurrenceRule, scheduledStart, scheduledEnd,
      notes, completedAt, params.id
    );

    try {
      await supabase.from('tasks').update({
        title, description, project_id: projectId, priority: String(priority), status,
        due_date: dueDate, due_time: dueTime, estimated_minutes: estimatedMinutes, actual_minutes: actualMinutes,
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags, recurrence_rule: recurrenceRule,
        scheduled_start: scheduledStart, scheduled_end: scheduledEnd, notes, completed_at: completedAt
      }).eq('id', params.id);
    } catch (e) {
      console.warn('Supabase update notice:', e);
    }

    if (body.subtasks && Array.isArray(body.subtasks)) {
      db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(params.id);
      const insertSt = db.prepare('INSERT INTO subtasks (id, task_id, title, completed, order_index) VALUES (?, ?, ?, ?, ?)');
      for (let idx = 0; idx < body.subtasks.length; idx++) {
        const st = body.subtasks[idx];
        const stId = st.id || `st_${Date.now()}_${idx}`;
        insertSt.run(stId, params.id, st.title, st.completed ? 1 : 0, idx);
      }
    }

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id) as any || { id: params.id, title, status };
    const subtaskRows = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index ASC').all(params.id) as any[];

    const task: Task = {
      id: updated.id,
      title: updated.title,
      description: updated.description || undefined,
      projectId: updated.project_id || undefined,
      priority: updated.priority,
      status: updated.status,
      dueDate: updated.due_date || undefined,
      dueTime: updated.due_time || undefined,
      estimatedMinutes: updated.estimated_minutes,
      actualMinutes: updated.actual_minutes,
      tags: updated.tags ? (typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags) : [],
      recurrenceRule: updated.recurrence_rule || undefined,
      subtasks: subtaskRows.map((st) => ({
        id: st.id,
        taskId: st.task_id,
        title: st.title,
        completed: Boolean(st.completed),
      })),
      scheduledStart: updated.scheduled_start || undefined,
      scheduledEnd: updated.scheduled_end || undefined,
      notes: updated.notes || undefined,
      createdAt: updated.created_at,
      completedAt: updated.completed_at || undefined,
      orderIndex: updated.order_index,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(params.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(params.id);

    try {
      await supabase.from('subtasks').delete().eq('task_id', params.id);
      await supabase.from('tasks').delete().eq('id', params.id);
    } catch (e) {
      console.warn('Supabase delete notice:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
