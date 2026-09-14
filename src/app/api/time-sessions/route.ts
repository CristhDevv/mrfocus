import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const sessions = db.prepare('SELECT * FROM time_sessions WHERE user_id = ?').all(userId);
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { taskId = null, projectId = null, type = 'pomodoro', durationMinutes = 25, notes = '', startTime, endTime } = await req.json();

    const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const start = startTime || now;
    const end = endTime || now;

    db.prepare(
      'INSERT INTO time_sessions (id, user_id, task_id, project_id, type, start_time, end_time, duration_minutes, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, taskId, projectId, type, start, end, durationMinutes, notes, now);

    try {
      await supabase.from('time_sessions').insert({
        id,
        user_id: userId,
        task_id: taskId,
        duration_minutes: durationMinutes,
        mode: type,
        notes,
        started_at: start,
        ended_at: end,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase time_session insert error:', e);
    }

    if (taskId) {
      db.prepare('UPDATE tasks SET actual_minutes = actual_minutes + ? WHERE id = ?').run(durationMinutes, taskId);
    }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 });
  }
}
