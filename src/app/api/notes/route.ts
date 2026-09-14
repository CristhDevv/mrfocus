import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const rows = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId) as any[];
    const notes: Note[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      projectId: r.project_id || undefined,
      taskId: r.task_id || undefined,
      tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
      isPinned: Boolean(r.is_pinned),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { title = 'Nueva Nota', content = '', projectId = null, taskId = null, tags = [], isPinned = false } = await req.json();

    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO notes (id, user_id, title, content, project_id, task_id, tags, is_pinned, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, title.trim(), content, projectId, taskId, JSON.stringify(tags), isPinned ? 1 : 0, now, now);

    try {
      await supabase.from('notes').insert({
        id,
        user_id: userId,
        title: title.trim(),
        content,
        project_id: projectId,
        task_id: taskId,
        tags,
        is_pinned: isPinned,
        created_at: now,
        updated_at: now,
      });
    } catch (e) {
      console.warn('Supabase insert note error:', e);
    }

    const newNote: Note = {
      id,
      title: title.trim(),
      content,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      tags,
      isPinned,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
