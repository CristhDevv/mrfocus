import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const projects = db.prepare(`SELECT * FROM projects`).all();
    const tasks = db.prepare(`SELECT * FROM tasks`).all();
    const subtasks = db.prepare(`SELECT * FROM subtasks`).all();
    const calendarEvents = db.prepare(`SELECT * FROM calendar_events`).all();
    const habits = db.prepare(`SELECT * FROM habits`).all();
    const habitLogs = db.prepare(`SELECT * FROM habit_logs`).all();
    const timeSessions = db.prepare(`SELECT * FROM time_sessions`).all();
    const notes = db.prepare(`SELECT * FROM notes`).all();
    const gamificationUser = db.prepare(`SELECT * FROM gamification_user`).all();
    const achievements = db.prepare(`SELECT * FROM achievements`).all();

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        projects,
        tasks,
        subtasks,
        calendarEvents,
        habits,
        habitLogs,
        timeSessions,
        notes,
        gamificationUser,
        achievements,
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const backup = await req.json();
    if (!backup.data) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    const { data } = backup;

    const restoreTransaction = db.transaction(() => {
      if (data.projects) {
        db.prepare(`DELETE FROM projects`).run();
        const stmt = db.prepare(`INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?)`);
        data.projects.forEach((p: Record<string, unknown>) => {
          stmt.run(p.id, p.name, p.color, p.icon, p.description, p.created_at);
        });
      }

      if (data.tasks) {
        db.prepare(`DELETE FROM tasks`).run();
        const stmt = db.prepare(`INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.tasks.forEach((t: Record<string, unknown>) => {
          stmt.run(
            t.id, t.title, t.description, t.project_id, t.priority, t.status,
            t.due_date, t.due_time, t.estimated_minutes, t.actual_minutes,
            t.tags, t.recurrence_rule, t.scheduled_start, t.scheduled_end,
            t.notes, t.created_at, t.completed_at, t.order_index
          );
        });
      }

      if (data.subtasks) {
        db.prepare(`DELETE FROM subtasks`).run();
        const stmt = db.prepare(`INSERT INTO subtasks VALUES (?, ?, ?, ?, ?)`);
        data.subtasks.forEach((st: Record<string, unknown>) => {
          stmt.run(st.id, st.task_id, st.title, st.completed, st.order_index);
        });
      }

      if (data.calendarEvents) {
        db.prepare(`DELETE FROM calendar_events`).run();
        const stmt = db.prepare(`INSERT INTO calendar_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.calendarEvents.forEach((ev: Record<string, unknown>) => {
          stmt.run(ev.id, ev.title, ev.description, ev.start_time, ev.end_time, ev.is_all_day, ev.color, ev.location, ev.project_id);
        });
      }

      if (data.habits) {
        db.prepare(`DELETE FROM habits`).run();
        const stmt = db.prepare(`INSERT INTO habits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.habits.forEach((h: Record<string, unknown>) => {
          stmt.run(h.id, h.name, h.icon, h.category, h.frequency, h.target_days_per_week, h.streak, h.best_streak, h.created_at);
        });
      }

      if (data.habitLogs) {
        db.prepare(`DELETE FROM habit_logs`).run();
        const stmt = db.prepare(`INSERT INTO habit_logs VALUES (?, ?, ?, ?)`);
        data.habitLogs.forEach((hl: Record<string, unknown>) => {
          stmt.run(hl.id, hl.habit_id, hl.completed_date, hl.created_at);
        });
      }

      if (data.timeSessions) {
        db.prepare(`DELETE FROM time_sessions`).run();
        const stmt = db.prepare(`INSERT INTO time_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.timeSessions.forEach((ts: Record<string, unknown>) => {
          stmt.run(ts.id, ts.task_id, ts.project_id, ts.type, ts.start_time, ts.end_time, ts.duration_minutes, ts.notes, ts.created_at);
        });
      }

      if (data.notes) {
        db.prepare(`DELETE FROM notes`).run();
        const stmt = db.prepare(`INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        data.notes.forEach((n: Record<string, unknown>) => {
          stmt.run(n.id, n.title, n.content, n.task_id, n.project_id, n.tags, n.updated_at, n.created_at);
        });
      }
    });

    restoreTransaction();

    return NextResponse.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Failed to import backup' }, { status: 500 });
  }
}
