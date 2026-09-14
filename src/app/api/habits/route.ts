import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Habit } from '@/types';

export async function GET() {
  try {
    const rows = db.prepare(`SELECT * FROM habits ORDER BY created_at ASC`).all() as Array<{
      id: string;
      name: string;
      icon: string;
      category: string;
      frequency: string;
      target_days_per_week: number;
      streak: number;
      best_streak: number;
      created_at: string;
    }>;

    // Fetch logs for all habits
    const habitIds = rows.map((h) => h.id);
    const logsMap: Record<string, string[]> = {};

    if (habitIds.length > 0) {
      const placeholders = habitIds.map(() => '?').join(',');
      const logs = db
        .prepare(`SELECT habit_id, completed_date FROM habit_logs WHERE habit_id IN (${placeholders}) ORDER BY completed_date DESC`)
        .all(...habitIds) as Array<{ habit_id: string; completed_date: string }>;

      logs.forEach((log) => {
        if (!logsMap[log.habit_id]) {
          logsMap[log.habit_id] = [];
        }
        logsMap[log.habit_id].push(log.completed_date);
      });
    }

    const habits: Habit[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      category: r.category,
      frequency: r.frequency as Habit['frequency'],
      targetDaysPerWeek: r.target_days_per_week,
      streak: r.streak,
      bestStreak: r.best_streak,
      createdAt: r.created_at,
      completedDates: logsMap[r.id] || [],
    }));

    return NextResponse.json({ habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      icon = 'Sparkles',
      category = 'General',
      frequency = 'daily',
      targetDaysPerWeek = 7,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO habits (id, name, icon, category, frequency, target_days_per_week, streak, best_streak, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, name.trim(), icon, category, frequency, targetDaysPerWeek, now);

    const newHabit: Habit = {
      id,
      name: name.trim(),
      icon,
      category,
      frequency,
      targetDaysPerWeek,
      streak: 0,
      bestStreak: 0,
      createdAt: now,
      completedDates: [],
    };

    return NextResponse.json({ habit: newHabit }, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
