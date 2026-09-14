import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Note } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const r = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id) as Record<string, unknown> | undefined;

    if (!r) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note: Note = {
      id: r.id as string,
      title: r.title as string,
      content: r.content as string,
      taskId: (r.task_id as string) || undefined,
      projectId: (r.project_id as string) || undefined,
      tags: r.tags ? JSON.parse(r.tags as string) : [],
      updatedAt: r.updated_at as string,
      createdAt: r.created_at as string,
    };

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title.trim());
    }
    if (body.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content);
    }
    if (body.taskId !== undefined) {
      updates.push('task_id = ?');
      values.push(body.taskId || null);
    }
    if (body.projectId !== undefined) {
      updates.push('project_id = ?');
      values.push(body.projectId || null);
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);
    const res = db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (res.changes === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const res = db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);

    if (res.changes === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
