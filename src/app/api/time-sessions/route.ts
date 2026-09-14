import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { TimeSession } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    let query = `
      SELECT ts.*, t.title as task_title, p.name as project_name, p.color as project_color
      FROM time_sessions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN projects p ON ts.project_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (startDate) {
      query += ` AND ts.start_time >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND ts.end_time <= ?`;
      params.push(endDate);
    }
    if (projectId) {
      query += ` AND ts.project_id = ?`;
      params.push(projectId);
    }
    if (taskId) {
      query += ` AND ts.task_id = ?`;
      params.push(taskId);
    }

    query += ` ORDER BY ts.start_time DESC`;

    const rows = db.prepare(query).all(...params) as Array<{
      id: string;
      task_id?: string;
      task_title?: string;
      project_id?: string;
      project_name?: string;
      project_color?: string;
      type: string;
      start_time: string;
      end_time: string;
      duration_minutes: number;
      notes?: string;
    }>;

    const sessions: TimeSession[] = rows.map((r) => ({
      id: r.id,
      taskId: r.task_id || undefined,
      taskTitle: r.task_title || undefined,
      projectId: r.project_id || undefined,
      projectName: r.project_name || undefined,
      projectColor: r.project_color || undefined,
      type: r.type as TimeSession['type'],
      startTime: r.start_time,
      endTime: r.end_time,
      durationMinutes: r.duration_minutes,
      notes: r.notes || undefined,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching time sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch time sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      taskId,
      projectId,
      type = 'pomodoro',
      startTime,
      endTime,
      durationMinutes,
      notes,
    } = body;

    if (!startTime || !endTime || !durationMinutes) {
      return NextResponse.json({ error: 'startTime, endTime, and durationMinutes are required' }, { status: 400 });
    }

    const id = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO time_sessions (
        id, task_id, project_id, type, start_time, end_time, duration_minutes, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      taskId || null,
      projectId || null,
      type,
      startTime,
      endTime,
      durationMinutes,
      notes || null,
      now
    );

    if (taskId) {
      db.prepare(`
        UPDATE tasks
        SET actual_minutes = actual_minutes + ?
        WHERE id = ?
      `).run(durationMinutes, taskId);
    }

    return NextResponse.json({
      session: {
        id,
        taskId,
        projectId,
        type,
        startTime,
        endTime,
        durationMinutes,
        notes,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording time session:', error);
    return NextResponse.json({ error: 'Failed to record time session' }, { status: 500 });
  }
}
