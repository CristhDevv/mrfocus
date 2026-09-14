import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { CalendarEvent } from '@/types';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      startTime: 'start_time',
      endTime: 'end_time',
      color: 'color',
      location: 'location',
      projectId: 'project_id',
    };

    Object.keys(fieldMap).forEach((k) => {
      if (body[k] !== undefined) {
        updates.push(`${fieldMap[k]} = ?`);
        values.push(body[k]);
      }
    });

    if (body.isAllDay !== undefined) {
      updates.push('is_all_day = ?');
      values.push(body.isAllDay ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const res = db.prepare(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (res.changes === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const row = db.prepare(`SELECT * FROM calendar_events WHERE id = ?`).get(id) as Record<string, unknown>;
    const event: CalendarEvent = {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string) || undefined,
      startTime: row.start_time as string,
      endTime: row.end_time as string,
      isAllDay: Boolean(row.is_all_day),
      color: (row.color as string) || undefined,
      location: (row.location as string) || undefined,
      projectId: (row.project_id as string) || undefined,
    };

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const res = db.prepare(`DELETE FROM calendar_events WHERE id = ?`).run(id);

    if (res.changes === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
