import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Note } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search');

    let query = `SELECT * FROM notes WHERE 1=1`;
    const params: string[] = [];

    if (taskId) {
      query += ` AND task_id = ?`;
      params.push(taskId);
    }
    if (projectId) {
      query += ` AND project_id = ?`;
      params.push(projectId);
    }
    if (search) {
      query += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const rows = db.prepare(query).all(...params) as Array<{
      id: string;
      title: string;
      content: string;
      task_id?: string;
      project_id?: string;
      tags: string;
      updated_at: string;
      created_at: string;
    }>;

    const notes: Note[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      taskId: r.task_id || undefined,
      projectId: r.project_id || undefined,
      tags: r.tags ? JSON.parse(r.tags) : [],
      updatedAt: r.updated_at,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title = 'Nota rápida',
      content = '',
      taskId,
      projectId,
      tags = [],
    } = body;

    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO notes (id, title, content, task_id, project_id, tags, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      content,
      taskId || null,
      projectId || null,
      JSON.stringify(tags),
      now,
      now
    );

    const newNote: Note = {
      id,
      title: title.trim(),
      content,
      taskId: taskId || undefined,
      projectId: projectId || undefined,
      tags,
      updatedAt: now,
      createdAt: now,
    };

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
