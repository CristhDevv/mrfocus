import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Project } from '@/types';

export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT p.*, COUNT(t.id) as task_count,
             SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `).all() as Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
      description?: string;
      task_count: number;
      completed_task_count: number;
    }>;

    const projects = rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      icon: r.icon,
      description: r.description || undefined,
      taskCount: r.task_count,
      completedTaskCount: r.completed_task_count || 0,
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      color = '#3b82f6',
      icon = 'Folder',
      description,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const id = `proj_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, color, icon, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), color, icon, description || null, now);

    const newProject: Project = {
      id,
      name: name.trim(),
      color,
      icon,
      description: description || undefined,
    };

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
