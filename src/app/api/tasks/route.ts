import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Task, Subtask } from '@/types';
import { parseNaturalLanguageTask } from '@/lib/nlp-parser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const priority = searchParams.get('priority');
    const dueDate = searchParams.get('dueDate');
    const search = searchParams.get('search');
    const scheduled = searchParams.get('scheduled'); // 'true' | 'false'

    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params: (string | number)[] = [];

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
    if (scheduled === 'true') {
      query += ` AND scheduled_start IS NOT NULL`;
    } else if (scheduled === 'false') {
      query += ` AND scheduled_start IS NULL`;
    }
    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY order_index ASC, priority ASC, created_at DESC`;

    const rows = db.prepare(query).all(...params) as Array<{
      id: string;
      title: string;
      description?: string;
      project_id?: string;
      priority: number;
      status: string;
      due_date?: string;
      due_time?: string;
      estimated_minutes: number;
      actual_minutes: number;
      tags: string;
      recurrence_rule?: string;
      scheduled_start?: string;
      scheduled_end?: string;
      notes?: string;
      created_at: string;
      completed_at?: string;
      order_index: number;
    }>;

    // Fetch all subtasks for these tasks in a single query
    const taskIds = rows.map((r) => r.id);
    let subtasksMap: Record<string, Subtask[]> = {};

    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      const subtaskRows = db
        .prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY order_index ASC`)
        .all(...taskIds) as Array<{
        id: string;
        task_id: string;
        title: string;
        completed: number;
        order_index: number;
      }>;

      subtaskRows.forEach((st) => {
        if (!subtasksMap[st.task_id]) {
          subtasksMap[st.task_id] = [];
        }
        subtasksMap[st.task_id].push({
          id: st.id,
          taskId: st.task_id,
          title: st.title,
          completed: Boolean(st.completed),
        });
      });
    }

    const tasks: Task[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      projectId: r.project_id || undefined,
      priority: (r.priority || 4) as Task['priority'],
      status: r.status as Task['status'],
      dueDate: r.due_date || undefined,
      dueTime: r.due_time || undefined,
      estimatedMinutes: r.estimated_minutes,
      actualMinutes: r.actual_minutes,
      tags: r.tags ? JSON.parse(r.tags) : [],
      recurrenceRule: r.recurrence_rule || undefined,
      subtasks: subtasksMap[r.id] || [],
      scheduledStart: r.scheduled_start || undefined,
      scheduledEnd: r.scheduled_end || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      completedAt: r.completed_at || undefined,
      orderIndex: r.order_index,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      title,
      description,
      projectId,
      priority = 4,
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
    } = body;

    // If natural language text provided, parse it
    if (naturalLanguageText) {
      const projects = db.prepare(`SELECT * FROM projects`).all() as Array<{ id: string; name: string; color: string; icon: string }>;
      const parsed = parseNaturalLanguageTask(naturalLanguageText, projects);
      title = parsed.title;
      dueDate = parsed.dueDate || dueDate;
      dueTime = parsed.dueTime || dueTime;
      recurrenceRule = parsed.recurrenceRule || recurrenceRule;
      priority = parsed.priority || priority;
      projectId = parsed.projectId || projectId;
      tags = parsed.tags.length > 0 ? parsed.tags : tags;
      estimatedMinutes = parsed.estimatedMinutes || estimatedMinutes;
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertTask = db.prepare(`
      INSERT INTO tasks (
        id, title, description, project_id, priority, status,
        due_date, due_time, estimated_minutes, actual_minutes,
        tags, recurrence_rule, scheduled_start, scheduled_end,
        notes, created_at, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      id,
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

    // Insert subtasks if any
    const createdSubtasks: Subtask[] = [];
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      const insertSubtask = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, order_index)
        VALUES (?, ?, ?, ?, ?)
      `);
      subtasks.forEach((st: { title: string; completed?: boolean }, idx: number) => {
        const stId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertSubtask.run(stId, id, st.title, st.completed ? 1 : 0, idx);
        createdSubtasks.push({
          id: stId,
          taskId: id,
          title: st.title,
          completed: Boolean(st.completed),
        });
      });
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
