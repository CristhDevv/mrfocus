import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const title = body.title !== undefined ? body.title : existing.title;
    const content = body.content !== undefined ? body.content : existing.content;
    const projectId = body.projectId !== undefined ? body.projectId : existing.project_id;
    const taskId = body.taskId !== undefined ? body.taskId : existing.task_id;
    const tags = body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags;
    const isPinned = body.isPinned !== undefined ? (body.isPinned ? 1 : 0) : existing.is_pinned;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE notes SET
        title = ?, content = ?, project_id = ?, task_id = ?, tags = ?, is_pinned = ?, updated_at = ?
      WHERE id = ?
    `).run(title, content, projectId, taskId, tags, isPinned, now, params.id);

    try {
      await supabase.from('notes').update({
        title, content, project_id: projectId, task_id: taskId,
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags, is_pinned: Boolean(isPinned), updated_at: now
      }).eq('id', params.id);
    } catch (e) {
      console.warn('Supabase update note notice:', e);
    }

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    db.prepare('DELETE FROM notes WHERE id = ?').run(params.id);
    try {
      await supabase.from('notes').delete().eq('id', params.id);
    } catch (e) {
      console.warn('Supabase note delete error:', e);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
