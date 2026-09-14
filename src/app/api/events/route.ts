import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CalendarEvent } from '@/types';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const rows = db.prepare('SELECT * FROM calendar_events WHERE user_id = ?').all(userId) as any[];
    const events: CalendarEvent[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      startTime: r.start_time,
      endTime: r.end_time,
      isAllDay: Boolean(r.is_all_day),
      color: r.color || '#18181B',
      location: r.location || undefined,
      projectId: r.project_id || undefined,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { title, description = '', startTime, endTime, isAllDay = false, color = '#18181B', location = '', projectId = null } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Title, startTime and endTime required' }, { status: 400 });
    }

    const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO calendar_events (id, user_id, title, description, start_time, end_time, is_all_day, color, location, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, title.trim(), description, startTime, endTime, isAllDay ? 1 : 0, color, location, projectId, now);

    try {
      await supabase.from('calendar_events').insert({
        id,
        user_id: userId,
        title: title.trim(),
        description,
        start_time: startTime,
        end_time: endTime,
        is_all_day: isAllDay,
        color,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase event insert notice:', e);
    }

    const newEvent: CalendarEvent = {
      id,
      title: title.trim(),
      description: description || undefined,
      startTime,
      endTime,
      isAllDay,
      color,
      location: location || undefined,
      projectId: projectId || undefined,
    };

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
