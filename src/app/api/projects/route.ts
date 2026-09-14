import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const projects = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(userId);
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { name, color = '#3b82f6', icon = 'Folder', description = '' } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO projects (id, user_id, name, color, icon, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, name.trim(), color, icon, description, now);

    try {
      await supabase.from('projects').insert({
        id,
        user_id: userId,
        name: name.trim(),
        color,
        icon,
        description,
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase insert project error:', err);
    }

    const newProject = { id, name: name.trim(), color, icon, description, task_count: 0, completed_task_count: 0 };
    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
