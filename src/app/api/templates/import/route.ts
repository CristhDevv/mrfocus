import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { validateTemplate, resolveTemplateDate, MrFocusTemplate } from '@/lib/template-schema';

export const dynamic = 'force-dynamic';

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
  const counters = { projects: 0, habits: 0, tasks: 0, events: 0, notes: 0 };

  // ---- 1. PROJECTS ----
  const projectNameToId = new Map<string, string>();

  try {
    const { data: sbProjs } = await supabase.from('projects').select('id, name').eq('user_id', user.id);
    (sbProjs || []).forEach((p: any) => projectNameToId.set(p.name.toLowerCase().trim(), p.id));
  } catch {}

  const existingProjects = db.prepare('SELECT id, name FROM projects WHERE user_id = ?').all(user.id) as { id: string; name: string }[];
  for (const p of existingProjects) {
    projectNameToId.set(p.name.toLowerCase().trim(), p.id);
  }

  for (const proj of (tmpl.projects || [])) {
    const key = proj.name.toLowerCase().trim();
    if (projectNameToId.has(key)) continue;

    const projId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      'INSERT INTO projects (id, user_id, name, color, icon, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(projId, user.id, proj.name, proj.color || '#475569', proj.icon || 'Layers', proj.description || '', now);

    try {
      await supabase.from('projects').insert({
        id: projId,
        user_id: user.id,
        name: proj.name,
        color: proj.color || '#475569',
        icon: proj.icon || 'Layers',
        description: proj.description || '',
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase template insert project error:', e);
    }

    projectNameToId.set(key, projId);
    counters.projects++;
  }

  // ---- 2. HABITS ----
  for (const habit of (tmpl.habits || [])) {
    const habitId = 'hab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const targetDays = habit.targetDays || (habit.frequency === 'weekdays' ? 5 : habit.frequency === 'weekends' ? 2 : 7);

    db.prepare(
      'INSERT INTO habits (id, user_id, name, icon, category, frequency, target_days_per_week, streak, best_streak, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      habitId, user.id, habit.name, habit.icon || 'Activity', habit.category || 'General',
      habit.frequency || 'daily', targetDays, 0, 0, now
    );

    try {
      await supabase.from('habits').insert({
        id: habitId,
        user_id: user.id,
        title: habit.name,
        name: habit.name,
        description: habit.description || '',
        category: habit.category || 'General',
        frequency: habit.frequency || 'daily',
        icon: habit.icon || 'Activity',
        color: habit.color || '#059669',
        target_per_day: targetDays,
        target_days_per_week: targetDays,
        streak_days: 0,
        streak: 0,
        best_streak: 0,
        completed_dates: [],
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase template insert habit error:', e);
    }

    counters.habits++;
  }

  // ---- 3. TASKS ----
  for (const task of (tmpl.tasks || [])) {
    const dueDate = resolveTemplateDate(task.dueDate);
    const projectId = task.projectName
      ? (projectNameToId.get(task.projectName.toLowerCase().trim()) || null)
      : null;

    let priorityNum = 2;
    if (task.priority === 'high' || task.priority === 1) priorityNum = 1;
    else if (task.priority === 'low' || task.priority === 3) priorityNum = 3;
    else priorityNum = 2;

    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, project_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?)`
    ).run(
      taskId, user.id, task.title, task.description || '',
      priorityNum, dueDate, projectId, task.notes || '', now, now
    );

    try {
      await supabase.from('tasks').insert({
        id: taskId,
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        status: 'todo',
        priority: String(priorityNum),
        due_date: dueDate || null,
        due_time: task.dueTime || null,
        project_id: projectId || null,
        notes: task.notes || null,
        tags: task.tags || [],
        estimated_minutes: task.estimatedMinutes || 30,
        actual_minutes: 0,
        order_index: 0,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase template insert task error:', e);
    }

    // Subtasks
    if (task.subtasks && Array.isArray(task.subtasks)) {
      for (let idx = 0; idx < task.subtasks.length; idx++) {
        const item = task.subtasks[idx];
        const stTitle = typeof item === 'string' ? item : item.title;
        const stCompleted = typeof item === 'object' ? Boolean(item.completed) : false;
        const stId = `st_${Date.now()}_${idx}`;

        db.prepare(
          'INSERT INTO subtasks (id, task_id, title, completed, order_index) VALUES (?, ?, ?, ?, ?)'
        ).run(stId, taskId, stTitle, stCompleted ? 1 : 0, idx);

        try {
          await supabase.from('subtasks').insert({
            id: stId,
            task_id: taskId,
            user_id: user.id,
            title: stTitle,
            completed: stCompleted,
            order_index: idx,
            created_at: now,
          });
        } catch {}
      }
    }

    counters.tasks++;
  }

  // ---- 4. EVENTS (Calendar Blocks) ----
  for (const ev of (tmpl.events || [])) {
    const eventDate = resolveTemplateDate(ev.date || 'today') || new Date().toISOString().split('T')[0];
    const projectId = ev.projectName ? (projectNameToId.get(ev.projectName.toLowerCase().trim()) || null) : null;

    let startIso = ev.startTime;
    let endIso = ev.endTime;

    // If given as "09:00", combine with resolved date
    if (ev.startTime && /^\d{1,2}:\d{2}$/.test(ev.startTime)) {
      startIso = `${eventDate}T${ev.startTime.padStart(5, '0')}:00.000Z`;
    }
    if (ev.endTime && /^\d{1,2}:\d{2}$/.test(ev.endTime)) {
      endIso = `${eventDate}T${ev.endTime.padStart(5, '0')}:00.000Z`;
    }

    const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(
      'INSERT INTO calendar_events (id, user_id, title, description, start_time, end_time, is_all_day, color, location, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(eventId, user.id, ev.title, ev.description || '', startIso, endIso, ev.isAllDay ? 1 : 0, ev.color || '#18181B', ev.location || '', projectId, now);

    try {
      await supabase.from('calendar_events').insert({
        id: eventId,
        user_id: user.id,
        title: ev.title,
        description: ev.description || '',
        start_time: startIso,
        end_time: endIso,
        is_all_day: Boolean(ev.isAllDay),
        color: ev.color || '#18181B',
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase event insert error:', e);
    }

    counters.events++;
  }

  // ---- 5. NOTES ----
  for (const n of (tmpl.notes || [])) {
    const projectId = n.projectName ? (projectNameToId.get(n.projectName.toLowerCase().trim()) || null) : null;
    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    db.prepare(
      'INSERT INTO notes (id, user_id, title, content, project_id, task_id, tags, is_pinned, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(noteId, user.id, n.title, n.content || '', projectId, null, JSON.stringify(n.tags || []), n.isPinned ? 1 : 0, now, now);

    try {
      await supabase.from('notes').insert({
        id: noteId,
        user_id: user.id,
        title: n.title,
        content: n.content || '',
        project_id: projectId,
        tags: n.tags || [],
        is_pinned: Boolean(n.isPinned),
        created_at: now,
        updated_at: now,
      });
    } catch (e) {
      console.warn('Supabase note insert error:', e);
    }

    counters.notes++;
  }

  return NextResponse.json({
    success: true,
    message: `Plantilla importada: ${counters.projects} proyectos, ${counters.habits} hábitos, ${counters.tasks} tareas, ${counters.events} eventos, ${counters.notes} notas creadas.`,
    created: counters,
    templateName: tmpl.name,
  });
}
