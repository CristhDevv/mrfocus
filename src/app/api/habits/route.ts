import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Habit } from '@/types';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    let habits: Habit[] = [];

    try {
      const { data: sbHabits, error: habErr } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!habErr && sbHabits && sbHabits.length > 0) {
        const { data: sbLogs } = await supabase
          .from('habit_logs')
          .select('habit_id, date')
          .eq('user_id', userId);

        const logsMap: Record<string, string[]> = {};
        (sbLogs || []).forEach((l: any) => {
          if (!logsMap[l.habit_id]) logsMap[l.habit_id] = [];
          logsMap[l.habit_id].push(l.date);
        });

        habits = sbHabits.map((r: any) => ({
          id: r.id,
          name: r.name || r.title || 'Hábito',
          icon: r.icon || 'Activity',
          category: r.category || 'General',
          frequency: (r.frequency || 'daily') as any,
          targetDaysPerWeek: r.target_days_per_week || r.target_per_day || 7,
          streak: r.streak || r.streak_days || 0,
          bestStreak: r.best_streak || 0,
          completedDates: logsMap[r.id] || (Array.isArray(r.completed_dates) ? r.completed_dates : []),
          createdAt: r.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase habits fetch notice:', err);
    }

    if (habits.length === 0) {
      const rows = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(userId) as any[];
      habits = rows.map((r) => {
        const logs = db.prepare('SELECT completed_date FROM habit_logs WHERE user_id = ? AND habit_id = ?').all(userId, r.id) as any[];
        return {
          id: r.id,
          name: r.name || r.title || 'Hábito',
          icon: r.icon || 'Activity',
          category: r.category || 'General',
          frequency: r.frequency || 'daily',
          targetDaysPerWeek: r.target_days_per_week || 7,
          streak: r.streak || 0,
          bestStreak: r.best_streak || 0,
          completedDates: logs.map((l) => l.completed_date),
          createdAt: r.created_at,
        };
      });
    }

    return NextResponse.json({ habits });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { name, icon = 'Activity', category = 'General', frequency = 'daily', targetDaysPerWeek = 7 } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    const id = `hab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO habits (id, user_id, name, icon, category, frequency, target_days_per_week, streak, best_streak, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, name.trim(), icon, category, frequency, targetDaysPerWeek, 0, 0, now);

    try {
      await supabase.from('habits').insert({
        id,
        user_id: userId,
        title: name.trim(),
        name: name.trim(),
        icon,
        category,
        frequency,
        target_per_day: targetDaysPerWeek,
        target_days_per_week: targetDaysPerWeek,
        streak_days: 0,
        streak: 0,
        best_streak: 0,
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase insert habit notice:', err);
    }

    const newHabit: Habit = {
      id,
      name: name.trim(),
      icon,
      category,
      frequency,
      targetDaysPerWeek,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: now,
    };

    return NextResponse.json({ habit: newHabit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
