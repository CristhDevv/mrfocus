import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Task, Subtask } from '@/types';
import { parseNaturalLanguageTask } from '@/lib/nlp-parser';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const priority = searchParams.get('priority');
    const dueDate = searchParams.get('dueDate');
    const search = searchParams.get('search');

    let tasks: Task[] = [];

    // 1. Query Supabase
    try {
      let sbQuery = supabase.from('tasks').select('*').eq('user_id', userId);

      if (status) sbQuery = sbQuery.eq('status', status);
      if (projectId) sbQuery = sbQuery.eq('project_id', projectId);
      if (dueDate) sbQuery = sbQuery.eq('due_date', dueDate);

      const { data: sbTasks, error: sbErr } = await sbQuery
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (!sbErr && sbTasks && sbTasks.length > 0) {
        const { data: sbSubtasks } = await supabase
          .from('subtasks')
          .select('*')
          .eq('user_id', userId)
          .order('order_index', { ascending: true });

        const subtaskMap: Record<string, Subtask[]> = {};
        (sbSubtasks || []).forEach((st: any) => {
          if (!subtaskMap[st.task_id]) subtaskMap[st.task_id] = [];
          subtaskMap[st.task_id].push({
            id: st.id,
            taskId: st.task_id,
            title: st.title,
            completed: Boolean(st.completed),
          });
        });

        tasks = sbTasks.map((r: any) => {
          let priorityVal = 3;
          if (r.priority === 'high' || r.priority === 1 || r.priority === '1') priorityVal = 1;
          else if (r.priority === 'medium' || r.priority === 2 || r.priority === '2') priorityVal = 2;
          else if (r.priority === 'low' || r.priority === 3 || r.priority === '3') priorityVal = 3;
          else if (r.priority) priorityVal = Number(r.priority);

          return {
            id: r.id,
            title: r.title,
            description: r.description || undefined,
            projectId: r.project_id || undefined,
            priority: priorityVal as any,
            status: r.status as Task['status'],
            dueDate: r.due_date || undefined,
            dueTime: r.due_time || undefined,
            estimatedMinutes: r.estimated_minutes || 30,
            actualMinutes: r.actual_minutes || 0,
            tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
            recurrenceRule: r.recurrence_rule || undefined,
            subtasks: subtaskMap[r.id] || [],
            scheduledStart: r.scheduled_start || undefined,
            scheduledEnd: r.scheduled_end || undefined,
            notes: r.notes || undefined,
            createdAt: r.created_at,
            completedAt: r.completed_at || undefined,
            orderIndex: r.order_index || 0,
          };
        });

        if (search) {
          const s = search.toLowerCase();
          tasks = tasks.filter((t) => t.title.toLowerCase().includes(s) || (t.description && t.description.toLowerCase().includes(s)));
        }
      }
    } catch (err) {
      console.warn('Supabase tasks fetch notice:', err);
    }

    // 2. Fallback to SQLite
    if (tasks.length === 0) {
      let query = `SELECT * FROM tasks WHERE user_id = ?`;
      const params: (string | number)[] = [userId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      if (projectId) {
        query += ` AND project_id = ?`;
        params.push(projectId);
      }
      if (priority) {
        query += ` AND priority = ?`;
        params.push(parseInt(priority, 10));
      }
      if (dueDate) {
        query += ` AND due_date = ?`;
        params.push(dueDate);
      }
      if (search) {
        query += ` AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY order_index ASC, priority ASC, created_at DESC`;

      const rows = db.prepare(query).all(...params) as any[];
      const taskIds = rows.map((r) => r.id);
      let subtasksMap: Record<string, Subtask[]> = {};

      if (taskIds.length > 0) {
        const placeholders = taskIds.map(() => '?').join(',');
        const subtaskRows = db
          .prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY order_index ASC`)
          .all(...taskIds) as any[];

        subtaskRows.forEach((st) => {
          if (!subtasksMap[st.task_id]) subtasksMap[st.task_id] = [];
          subtasksMap[st.task_id].push({
            id: st.id,
            taskId: st.task_id,
            title: st.title,
            completed: Boolean(st.completed),
          });
        });
      }

      tasks = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || undefined,
        projectId: r.project_id || undefined,
        priority: (r.priority || 4) as Task['priority'],
        status: r.status as Task['status'],
        dueDate: r.due_date || undefined,
        dueTime: r.due_time || undefined,
        estimatedMinutes: r.estimated_minutes || 30,
        actualMinutes: r.actual_minutes || 0,
        tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
        recurrenceRule: r.recurrence_rule || undefined,
        subtasks: subtasksMap[r.id] || [],
        scheduledStart: r.scheduled_start || undefined,
        scheduledEnd: r.scheduled_end || undefined,
        notes: r.notes || undefined,
        createdAt: r.created_at,
        completedAt: r.completed_at || undefined,
        orderIndex: r.order_index,
      }));
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const body = await req.json();
    let {
      title,
      description,
      projectId,
      priority = 2,
      status = 'todo',
      dueDate,
      dueTime,
      estimatedMinutes = 30,
      tags = [],
      recurrenceRule,
      subtasks = [],
      scheduledStart,
      scheduledEnd,
      notes,
      naturalLanguageText,
      defaultDueDate,
    } = body;

    if (naturalLanguageText) {
      const projects = db.prepare(`SELECT * FROM projects WHERE user_id = ?`).all(userId) as any[];
      const parsed = parseNaturalLanguageTask(naturalLanguageText, projects);
      title = parsed.title;
      dueDate = parsed.dueDate || defaultDueDate || dueDate;
      dueTime = parsed.dueTime || dueTime;
      recurrenceRule = parsed.recurrenceRule || recurrenceRule;
      priority = parsed.priority || priority;
      projectId = parsed.projectId || projectId;
      tags = parsed.tags.length > 0 ? parsed.tags : tags;
      estimatedMinutes = parsed.estimatedMinutes || estimatedMinutes;
    } else if (!dueDate && defaultDueDate) {
      dueDate = defaultDueDate;
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertTask = db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, description, project_id, priority, status,
        due_date, due_time, estimated_minutes, actual_minutes,
        tags, recurrence_rule, scheduled_start, scheduled_end,
        notes, created_at, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      id,
      userId,
      title.trim(),
      description || null,
      projectId || null,
      priority,
      status,
      dueDate || null,
      dueTime || null,
      estimatedMinutes,
      0,
      JSON.stringify(tags),
      recurrenceRule || null,
      scheduledStart || null,
      scheduledEnd || null,
      notes || null,
      now,
      0
    );

    try {
      await supabase.from('tasks').insert({
        id,
        user_id: userId,
        title: title.trim(),
        description: description || null,
        project_id: projectId || null,
        priority: String(priority),
        status,
        due_date: dueDate || null,
        due_time: dueTime || null,
        estimated_minutes: estimatedMinutes,
        actual_minutes: 0,
        tags,
        recurrence_rule: recurrenceRule || null,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        notes: notes || null,
        created_at: now,
        order_index: 0,
      });
    } catch (err) {
      console.warn('Supabase task insert notice:', err);
    }

    const createdSubtasks: Subtask[] = [];
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      const insertSubtask = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, order_index)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (let idx = 0; idx < subtasks.length; idx++) {
        const st = subtasks[idx];
        const stId = `st_${Date.now()}_${idx}`;
        insertSubtask.run(stId, id, st.title, st.completed ? 1 : 0, idx);
        try {
          await supabase.from('subtasks').insert({
            id: stId,
            task_id: id,
            user_id: userId,
            title: st.title,
            completed: Boolean(st.completed),
            order_index: idx,
            created_at: now,
          });
        } catch {}
        createdSubtasks.push({
          id: stId,
          taskId: id,
          title: st.title,
          completed: Boolean(st.completed),
        });
      }
    }

    const newTask: Task = {
      id,
      title: title.trim(),
      description: description || undefined,
      projectId: projectId || undefined,
      priority,
      status,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      estimatedMinutes,
      actualMinutes: 0,
      tags,
      recurrenceRule: recurrenceRule || undefined,
      subtasks: createdSubtasks,
      scheduledStart: scheduledStart || undefined,
      scheduledEnd: scheduledEnd || undefined,
      notes: notes || undefined,
      createdAt: now,
      orderIndex: 0,
    };

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
