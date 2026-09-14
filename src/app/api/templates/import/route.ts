import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { validateTemplate, resolveTemplateDate, MrFocusTemplate } from '@/lib/template-schema';

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const validation = validateTemplate(body);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

  const tmpl = (body as MrFocusTemplate).template;
  const now = new Date().toISOString();
  const counters = { projects: 0, habits: 0, tasks: 0 };

  // ---- 1. PROJECTS ----
  const projectNameToId = new Map<string, string>();

  // Load existing projects for user
  const existingProjects = db.prepare('SELECT id, name FROM projects WHERE user_id = ?').all(user.id) as { id: string; name: string }[];
  for (const p of existingProjects) {
    projectNameToId.set(p.name.toLowerCase().trim(), p.id);
  }

  for (const proj of (tmpl.projects || [])) {
    const key = proj.name.toLowerCase().trim();
    if (projectNameToId.has(key)) continue; // already exists

    const projId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      'INSERT INTO projects (id, user_id, name, color, icon, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(projId, user.id, proj.name, proj.color || '#475569', proj.icon || 'Layers', proj.description || '', now);

    try {
      await supabase.from('projects').insert({
        id: projId, user_id: user.id, name: proj.name,
        color: proj.color || '#475569', icon: proj.icon || 'Layers',
        description: proj.description || '', created_at: now,
      });
    } catch {}

    projectNameToId.set(key, projId);
    counters.projects++;
  }

  // ---- 2. HABITS ----
  for (const habit of (tmpl.habits || [])) {
    const habitId = 'habit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      'INSERT INTO habits (id, user_id, name, description, frequency, icon, color, streak, completed_dates, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      habitId, user.id, habit.name, habit.description || '',
      habit.frequency || 'daily', habit.icon || 'Activity', habit.color || '#059669',
      0, JSON.stringify([]), now
    );

    try {
      await supabase.from('habits').insert({
        id: habitId, user_id: user.id, name: habit.name,
        description: habit.description || '', frequency: habit.frequency || 'daily',
        icon: habit.icon || 'Activity', color: habit.color || '#059669',
        streak: 0, completed_dates: JSON.stringify([]), created_at: now,
      });
    } catch {}

    counters.habits++;
  }

  // ---- 3. TASKS ----
  for (const task of (tmpl.tasks || [])) {
    const dueDate = resolveTemplateDate(task.dueDate);
    const projectId = task.projectName
      ? (projectNameToId.get(task.projectName.toLowerCase().trim()) || null)
      : null;

    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, project_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
    ).run(
      taskId, user.id, task.title, task.description || '',
      task.priority || 'medium', dueDate, projectId, task.notes || '', now, now
    );

    try {
      await supabase.from('tasks').insert({
        id: taskId, user_id: user.id, title: task.title,
        description: task.description || '', status: 'pending',
        priority: task.priority || 'medium', due_date: dueDate,
        project_id: projectId, notes: task.notes || '',
        created_at: now, updated_at: now,
      });
    } catch {}

    counters.tasks++;
  }

  return NextResponse.json({
    success: true,
    message: `Plantilla importada: ${counters.projects} proyectos, ${counters.habits} hábitos, ${counters.tasks} tareas creadas.`,
    created: counters,
    templateName: tmpl.name,
  });
}
