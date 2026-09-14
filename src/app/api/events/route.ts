import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { CalendarEvent } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `SELECT * FROM calendar_events WHERE 1=1`;
    const params: string[] = [];

    if (startDate) {
      query += ` AND end_time >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND start_time <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY start_time ASC`;

    const rows = db.prepare(query).all(...params) as Array<{
      id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      is_all_day: number;
      color?: string;
      location?: string;
      project_id?: string;
    }>;

    const events: CalendarEvent[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      startTime: r.start_time,
      endTime: r.end_time,
      isAllDay: Boolean(r.is_all_day),
      color: r.color || undefined,
      location: r.location || undefined,
      projectId: r.project_id || undefined,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      isAllDay = false,
      color = '#3b82f6',
      location,
      projectId,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Title, startTime, and endTime are required' }, { status: 400 });
    }

    const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(`
      INSERT INTO calendar_events (
        id, title, description, start_time, end_time, is_all_day, color, location, project_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      description || null,
      startTime,
      endTime,
      isAllDay ? 1 : 0,
      color,
      location || null,
      projectId || null
    );

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
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}
