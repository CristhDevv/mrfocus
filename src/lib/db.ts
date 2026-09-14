import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'mrfocus_db.json');

export interface DbState {
  users: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  subtasks: Array<Record<string, unknown>>;
  calendar_events: Array<Record<string, unknown>>;
  habits: Array<Record<string, unknown>>;
  habit_logs: Array<Record<string, unknown>>;
  time_sessions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  gamification_user: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
}

const defaultState: DbState = {
  users: [],
  projects: [],
  tasks: [],
  subtasks: [],
  calendar_events: [],
  habits: [],
  habit_logs: [],
  time_sessions: [],
  notes: [],
  gamification_user: [
    {
      id: 'default_user',
      level: 1,
      xp: 0,
      total_xp: 0,
      streak_days: 0,
      updated_at: new Date().toISOString(),
    },
  ],
  achievements: [],
};

function loadDb(): DbState {
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        ...defaultState,
        ...parsed,
        users: parsed.users || [],
        gamification_user:
          parsed.gamification_user && parsed.gamification_user.length > 0
            ? parsed.gamification_user
            : defaultState.gamification_user,
      };
    }
  } catch (err) {
    console.error('Error loading db file, initializing default:', err);
  }
  return { ...defaultState };
}

let dbState: DbState = loadDb();

function saveDb() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

export class Statement {
  private query: string;

  constructor(query: string) {
    this.query = query.trim();
  }

  all(...params: unknown[]): Array<Record<string, unknown>> {
    const q = this.query;

    // 0. SELECT * FROM users
    if (q.includes('FROM users')) {
      let list = [...(dbState.users || [])];
      if (q.includes('email = ?')) {
        const email = String(params[0] || '').toLowerCase().trim();
        list = list.filter((u) => String(u.email || '').toLowerCase().trim() === email);
      } else if (q.includes('id = ?')) {
        const id = params[0];
        list = list.filter((u) => u.id === id);
      }
      return list;
    }

    // 1. SELECT * FROM projects
    if (q.includes('FROM projects')) {
      let projects = [...(dbState.projects || [])];
      if (q.includes('user_id = ?')) {
        const uid = params[0];
        projects = projects.filter((p) => p.user_id === uid);
      }
      return projects.map((p) => {
        const pTasks = (dbState.tasks || []).filter((t) => t.project_id === p.id);
        const completed = pTasks.filter((t) => t.status === 'done').length;
        return {
          ...p,
          task_count: pTasks.length,
          completed_task_count: completed,
        };
      });
    }

    // 2. SELECT * FROM tasks
    if (q.includes('FROM tasks')) {
      let list = [...(dbState.tasks || [])];
      let paramIdx = 0;

      if (q.includes('user_id = ?')) {
        const uid = params[paramIdx++];
        list = list.filter((t) => t.user_id === uid);
      }
      if (q.includes('status = ?')) {
        const val = params[paramIdx++];
        list = list.filter((t) => t.status === val);
      }
      if (q.includes("status != 'done'")) {
        list = list.filter((t) => t.status !== 'done');
      }
      if (q.includes('project_id = ?')) {
        const val = params[paramIdx++];
        list = list.filter((t) => t.project_id === val);
      }
      if (q.includes('priority = ?')) {
        const val = params[paramIdx++];
        list = list.filter((t) => Number(t.priority) === Number(val));
      }
      if (q.includes('due_date = ?')) {
        const val = params[paramIdx++];
        list = list.filter((t) => t.due_date === val);
      }
      if (q.includes('(due_date = ? OR due_date < ? OR due_date IS NULL)')) {
        const d1 = params[paramIdx++] as string;
        paramIdx++;
        list = list.filter((t) => !t.due_date || t.due_date <= d1);
      }
      if (q.includes('scheduled_start IS NOT NULL')) {
        list = list.filter((t) => Boolean(t.scheduled_start));
      }
      if (q.includes('scheduled_start IS NULL')) {
        list = list.filter((t) => !t.scheduled_start);
      }
      if (q.includes('scheduled_start LIKE ?')) {
        const prefix = (params[paramIdx++] as string).replace(/%/g, '');
        list = list.filter((t) => t.scheduled_start && String(t.scheduled_start).startsWith(prefix));
      }
      if (q.includes('title LIKE ? OR description LIKE ? OR tags LIKE ?')) {
        const search = (params[paramIdx++] as string).replace(/%/g, '').toLowerCase();
        paramIdx += 2;
        list = list.filter((t) => {
          const tTitle = String(t.title || '').toLowerCase();
          const tDesc = String(t.description || '').toLowerCase();
          const tTags = String(t.tags || '').toLowerCase();
          return tTitle.includes(search) || tDesc.includes(search) || tTags.includes(search);
        });
      }
      if (q.includes('id IN (')) {
        const ids = params.slice(paramIdx);
        list = list.filter((t) => ids.includes(t.id));
      }

      // Sort
      list.sort((a, b) => {
        const orderA = Number(a.order_index ?? 0);
        const orderB = Number(b.order_index ?? 0);
        if (orderA !== orderB) return orderA - orderB;
        const pA = Number(a.priority ?? 4);
        const pB = Number(b.priority ?? 4);
        return pA - pB;
      });

      return list;
    }

    // 3. SELECT * FROM subtasks
    if (q.includes('FROM subtasks')) {
      let list = [...(dbState.subtasks || [])];
      if (q.includes('task_id = ?')) {
        const taskId = params[0];
        list = list.filter((st) => st.task_id === taskId);
      } else if (q.includes('task_id IN (')) {
        list = list.filter((st) => params.includes(st.task_id));
      }
      list.sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
      return list;
    }

    // 4. SELECT * FROM calendar_events
    if (q.includes('FROM calendar_events')) {
      let list = [...(dbState.calendar_events || [])];
      let paramIdx = 0;
      if (q.includes('user_id = ?')) {
        const uid = params[paramIdx++];
        list = list.filter((ev) => ev.user_id === uid);
      }
      if (q.includes('end_time >= ?')) {
        const start = params[paramIdx++] as string;
        list = list.filter((ev) => String(ev.end_time) >= start);
      }
      if (q.includes('start_time <= ?')) {
        const end = params[paramIdx++] as string;
        list = list.filter((ev) => String(ev.start_time) <= end);
      }
      if (q.includes('start_time LIKE ? OR end_time LIKE ?')) {
        const prefix = (params[0] as string).replace(/%/g, '');
        list = list.filter((ev) => String(ev.start_time).startsWith(prefix) || String(ev.end_time).startsWith(prefix));
      }
      list.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
      return list;
    }

    // 5. SELECT * FROM habits
    if (q.includes('FROM habits')) {
      let list = [...(dbState.habits || [])];
      if (q.includes('user_id = ?')) {
        const uid = params[0];
        list = list.filter((h) => h.user_id === uid);
      }
      return list;
    }

    // 6. SELECT * FROM habit_logs
    if (q.includes('FROM habit_logs')) {
      let list = [...(dbState.habit_logs || [])];
      let paramIdx = 0;
      if (q.includes('user_id = ?')) {
        const uid = params[paramIdx++];
        list = list.filter((hl) => hl.user_id === uid);
      }
      if (q.includes('habit_id = ?')) {
        const hid = params[paramIdx++];
        list = list.filter((hl) => hl.habit_id === hid);
      } else if (q.includes('habit_id IN (')) {
        list = list.filter((hl) => params.includes(hl.habit_id));
      }
      return list;
    }

    // 7. SELECT * FROM time_sessions
    if (q.includes('FROM time_sessions')) {
      let list = [...(dbState.time_sessions || [])];
      let paramIdx = 0;
      if (q.includes('user_id = ?')) {
        const uid = params[paramIdx++];
        list = list.filter((ts) => ts.user_id === uid);
      }
      if (q.includes('ts.start_time >= ?')) {
        const start = params[paramIdx++] as string;
        list = list.filter((ts) => String(ts.start_time) >= start);
      }
      if (q.includes('ts.end_time <= ?')) {
        const end = params[paramIdx++] as string;
        list = list.filter((ts) => String(ts.end_time) <= end);
      }
      if (q.includes('ts.project_id = ?')) {
        const pid = params[paramIdx++];
        list = list.filter((ts) => ts.project_id === pid);
      }
      if (q.includes('ts.task_id = ?')) {
        const tid = params[paramIdx++];
        list = list.filter((ts) => ts.task_id === tid);
      }

      const taskMap = new Map((dbState.tasks || []).map((t) => [t.id, t]));
      const projMap = new Map((dbState.projects || []).map((p) => [p.id, p]));

      const enriched: Array<Record<string, unknown>> = list.map((ts) => {
        const t = ts.task_id ? taskMap.get(ts.task_id as string) : undefined;
        const p = ts.project_id ? projMap.get(ts.project_id as string) : undefined;
        return {
          ...ts,
          task_title: t?.title,
          project_name: p?.name,
          project_color: p?.color,
        };
      });

      enriched.sort((a, b) => String(b.start_time || '').localeCompare(String(a.start_time || '')));
      return enriched;
    }

    // 8. SELECT * FROM notes
    if (q.includes('FROM notes')) {
      let list = [...(dbState.notes || [])];
      let paramIdx = 0;
      if (q.includes('user_id = ?')) {
        const uid = params[paramIdx++];
        list = list.filter((n) => n.user_id === uid);
      }
      if (q.includes('task_id = ?')) {
        const tid = params[paramIdx++];
        list = list.filter((n) => n.task_id === tid);
      }
      if (q.includes('project_id = ?')) {
        const pid = params[paramIdx++];
        list = list.filter((n) => n.project_id === pid);
      }
      if (q.includes('title LIKE ? OR content LIKE ?')) {
        const search = (params[paramIdx++] as string).replace(/%/g, '').toLowerCase();
        list = list.filter((n) => String(n.title || '').toLowerCase().includes(search) || String(n.content || '').toLowerCase().includes(search));
      }
      list.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      return list;
    }

    // 9. SELECT * FROM achievements
    if (q.includes('FROM achievements')) {
      return [...(dbState.achievements || [])];
    }

    return [];
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const q = this.query;

    if (q.includes('FROM users WHERE email = ?')) {
      const email = String(params[0] || '').toLowerCase().trim();
      return (dbState.users || []).find((u) => String(u.email || '').toLowerCase().trim() === email);
    }
    if (q.includes('FROM users WHERE id = ?')) {
      return (dbState.users || []).find((u) => u.id === params[0]);
    }
    if (q.includes('COUNT(*) as c FROM tasks')) {
      const prefix = params[0] ? (params[0] as string).replace(/%/g, '') : '';
      const count = (dbState.tasks || []).filter(
        (t) => t.status === 'done' && (!prefix || (t.completed_at && String(t.completed_at).startsWith(prefix)))
      ).length;
      return { c: count };
    }
    if (q.includes('SUM(duration_minutes) as m FROM time_sessions')) {
      const prefix = params[0] ? (params[0] as string).replace(/%/g, '') : '';
      const sum = (dbState.time_sessions || [])
        .filter((ts) => !prefix || (ts.start_time && String(ts.start_time).startsWith(prefix)))
        .reduce((acc, ts) => acc + Number(ts.duration_minutes || 0), 0);
      return { m: sum };
    }
    if (q.includes('COUNT(*) as c FROM habit_logs')) {
      const d = params[0];
      const count = (dbState.habit_logs || []).filter((hl) => !d || hl.completed_date === d).length;
      return { c: count };
    }
    if (q.includes('FROM tasks WHERE id = ?')) {
      return (dbState.tasks || []).find((t) => t.id === params[0]);
    }
    if (q.includes('FROM projects WHERE id = ?')) {
      return (dbState.projects || []).find((p) => p.id === params[0]);
    }
    if (q.includes('FROM habits WHERE id = ?')) {
      return (dbState.habits || []).find((h) => h.id === params[0]);
    }
    if (q.includes('FROM habit_logs WHERE habit_id = ? AND completed_date = ?')) {
      return (dbState.habit_logs || []).find(
        (hl) => hl.habit_id === params[0] && hl.completed_date === params[1]
      );
    }
    if (q.includes('FROM calendar_events WHERE id = ?')) {
      return (dbState.calendar_events || []).find((ev) => ev.id === params[0]);
    }
    if (q.includes('FROM notes WHERE id = ?')) {
      return (dbState.notes || []).find((n) => n.id === params[0]);
    }

    const allRes = this.all(...params);
    return allRes[0];
  }

  run(...params: unknown[]): { changes: number } {
    const q = this.query;
    let changes = 0;

    // INSERT INTO users
    if (q.startsWith('INSERT INTO users')) {
      const [id, email, password_hash, name, created_at, updated_at] = params;
      dbState.users = dbState.users || [];
      dbState.users.push({ id, email, password_hash, name, created_at, updated_at });
      changes = 1;
    }
    // INSERT INTO tasks
    else if (q.startsWith('INSERT INTO tasks')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const taskObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        taskObj[col] = params[idx];
      });
      dbState.tasks.push(taskObj);
      changes = 1;
    }
    // UPDATE tasks
    else if (q.startsWith('UPDATE tasks')) {
      const taskId = params[params.length - 1];
      const task = dbState.tasks.find((t) => t.id === taskId);
      if (task) {
        if (q.includes('scheduled_start = ?, scheduled_end = ?')) {
          task.scheduled_start = params[0];
          task.scheduled_end = params[1];
        } else if (q.includes('actual_minutes = actual_minutes + ?')) {
          task.actual_minutes = Number(task.actual_minutes || 0) + Number(params[0]);
        } else {
          const setClause = q.replace(/^UPDATE tasks SET /i, '').replace(/ WHERE id = \?$/i, '');
          const fields = setClause.split(',').map((f) => f.trim().split('=')[0].trim());
          fields.forEach((field, idx) => {
            task[field] = params[idx];
          });
        }
        changes = 1;
      }
    }
    // DELETE FROM tasks
    else if (q.startsWith('DELETE FROM tasks')) {
      if (q.includes('WHERE id = ?')) {
        const id = params[0];
        const prevLen = dbState.tasks.length;
        dbState.tasks = dbState.tasks.filter((t) => t.id !== id);
        changes = prevLen - dbState.tasks.length;
      } else {
        dbState.tasks = [];
        changes = 1;
      }
    }
    // INSERT INTO subtasks
    else if (q.startsWith('INSERT INTO subtasks')) {
      const [id, task_id, title, completed, order_index] = params;
      dbState.subtasks.push({ id, task_id, title, completed, order_index });
      changes = 1;
    }
    // DELETE FROM subtasks
    else if (q.startsWith('DELETE FROM subtasks')) {
      if (q.includes('WHERE task_id = ?')) {
        const taskId = params[0];
        dbState.subtasks = dbState.subtasks.filter((st) => st.task_id !== taskId);
        changes = 1;
      } else {
        dbState.subtasks = [];
        changes = 1;
      }
    }
    // INSERT INTO calendar_events
    else if (q.startsWith('INSERT INTO calendar_events')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const evObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        evObj[col] = params[idx];
      });
      dbState.calendar_events.push(evObj);
      changes = 1;
    }
    // UPDATE calendar_events
    else if (q.startsWith('UPDATE calendar_events')) {
      const id = params[params.length - 1];
      const ev = dbState.calendar_events.find((e) => e.id === id);
      if (ev) {
        const setClause = q.replace(/^UPDATE calendar_events SET /i, '').replace(/ WHERE id = \?$/i, '');
        const fields = setClause.split(',').map((f) => f.trim().split('=')[0].trim());
        fields.forEach((field, idx) => {
          ev[field] = params[idx];
        });
        changes = 1;
      }
    }
    // DELETE FROM calendar_events
    else if (q.startsWith('DELETE FROM calendar_events')) {
      if (q.includes('WHERE id = ?')) {
        const id = params[0];
        dbState.calendar_events = dbState.calendar_events.filter((e) => e.id !== id);
        changes = 1;
      } else {
        dbState.calendar_events = [];
        changes = 1;
      }
    }
    // INSERT INTO habits
    else if (q.startsWith('INSERT INTO habits')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const habObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        habObj[col] = params[idx];
      });
      dbState.habits.push(habObj);
      changes = 1;
    }
    // UPDATE habits
    else if (q.startsWith('UPDATE habits')) {
      const id = params[params.length - 1];
      const habit = dbState.habits.find((h) => h.id === id);
      if (habit) {
        if (q.includes('streak = ?, best_streak = ?')) {
          habit.streak = Number(params[0]);
          habit.best_streak = Number(params[1]);
        } else {
          const setClause = q.replace(/^UPDATE habits SET /i, '').replace(/ WHERE id = \?$/i, '');
          const fields = setClause.split(',').map((f) => f.trim().split('=')[0].trim());
          fields.forEach((field, idx) => {
            habit[field] = params[idx];
          });
        }
        changes = 1;
      }
    }
    // DELETE FROM habits
    else if (q.startsWith('DELETE FROM habits')) {
      if (q.includes('WHERE id = ?')) {
        const id = params[0];
        dbState.habits = dbState.habits.filter((h) => h.id !== id);
        changes = 1;
      } else {
        dbState.habits = [];
        changes = 1;
      }
    }
    // INSERT INTO habit_logs
    else if (q.startsWith('INSERT INTO habit_logs')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const logObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        logObj[col] = params[idx];
      });
      dbState.habit_logs.push(logObj);
      changes = 1;
    }
    // DELETE FROM habit_logs
    else if (q.startsWith('DELETE FROM habit_logs')) {
      if (q.includes('WHERE habit_id = ? AND completed_date = ?')) {
        const [hid, cdate] = params;
        dbState.habit_logs = dbState.habit_logs.filter(
          (hl) => !(hl.habit_id === hid && hl.completed_date === cdate)
        );
        changes = 1;
      } else if (q.includes('WHERE habit_id = ?')) {
        dbState.habit_logs = dbState.habit_logs.filter((hl) => hl.habit_id !== params[0]);
        changes = 1;
      } else {
        dbState.habit_logs = [];
        changes = 1;
      }
    }
    // INSERT INTO time_sessions
    else if (q.startsWith('INSERT INTO time_sessions')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const sessObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        sessObj[col] = params[idx];
      });
      dbState.time_sessions.push(sessObj);
      changes = 1;
    }
    // DELETE FROM time_sessions
    else if (q.startsWith('DELETE FROM time_sessions')) {
      dbState.time_sessions = [];
      changes = 1;
    }
    // INSERT INTO notes
    else if (q.startsWith('INSERT INTO notes')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const noteObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        noteObj[col] = params[idx];
      });
      dbState.notes.push(noteObj);
      changes = 1;
    }
    // UPDATE notes
    else if (q.startsWith('UPDATE notes')) {
      const id = params[params.length - 1];
      const note = dbState.notes.find((n) => n.id === id);
      if (note) {
        const setClause = q.replace(/^UPDATE notes SET /i, '').replace(/ WHERE id = \?$/i, '');
        const fields = setClause.split(',').map((f) => f.trim().split('=')[0].trim());
        fields.forEach((field, idx) => {
          note[field] = params[idx];
        });
        changes = 1;
      }
    }
    // DELETE FROM notes
    else if (q.startsWith('DELETE FROM notes')) {
      if (q.includes('WHERE id = ?')) {
        const id = params[0];
        dbState.notes = dbState.notes.filter((n) => n.id !== id);
        changes = 1;
      } else {
        dbState.notes = [];
        changes = 1;
      }
    }
    // INSERT INTO projects
    else if (q.startsWith('INSERT INTO projects')) {
      const cols = q.slice(q.indexOf('(') + 1, q.indexOf(')')).split(',').map((c) => c.trim());
      const projObj: Record<string, unknown> = {};
      cols.forEach((col, idx) => {
        projObj[col] = params[idx];
      });
      dbState.projects.push(projObj);
      changes = 1;
    }
    // DELETE FROM projects
    else if (q.startsWith('DELETE FROM projects')) {
      dbState.projects = [];
      changes = 1;
    }

    saveDb();
    return { changes };
  }
}

class DbWrapper {
  prepare(sql: string): Statement {
    return new Statement(sql);
  }

  exec(sql: string): void {}

  pragma(pragma: string): void {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: unknown[]) => {
      const res = fn(...args);
      saveDb();
      return res;
    }) as T;
  }
}

const db = new DbWrapper();
export default db;
