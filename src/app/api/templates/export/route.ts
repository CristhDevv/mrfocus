import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { MrFocusTemplate } from '@/lib/template-schema';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const projects = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(user.id) as any[];
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(user.id) as any[];
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? AND status != 'done'").all(user.id) as any[];

  const projectIdToName = new Map(projects.map((p: any) => [p.id, p.name]));

  const exportedTemplate: MrFocusTemplate = {
    version: '1.0',
    template: {
      name: `Exportacion de ${user.name} — ${new Date().toLocaleDateString('es-CO')}`,
      description: 'Plantilla exportada desde mr focus',
      author: user.name,
      tags: ['exportado', 'mrfocus'],
      projects: projects.map((p: any) => ({
        name: p.name,
        color: p.color,
        icon: p.icon,
        description: p.description,
      })),
      habits: habits.map((h: any) => ({
        name: h.name,
        description: h.description,
        frequency: h.frequency || 'daily',
        icon: h.icon,
        color: h.color,
      })),
      tasks: tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        priority: t.priority || 'medium',
        dueDate: t.due_date || null,
        projectName: t.project_id ? projectIdToName.get(t.project_id) : undefined,
        notes: t.notes,
      })),
    },
  };

  return NextResponse.json(exportedTemplate, {
    headers: {
      'Content-Disposition': 'attachment; filename="mrfocus-template.json"',
      'Content-Type': 'application/json',
    },
  });
}
