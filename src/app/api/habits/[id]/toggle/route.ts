import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { format, subDays } from 'date-fns';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const targetDate = body.date || format(new Date(), 'yyyy-MM-dd');

    const habit = db.prepare(`SELECT * FROM habits WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const existingLog = db
      .prepare(`SELECT * FROM habit_logs WHERE habit_id = ? AND completed_date = ?`)
      .get(id, targetDate);

    let completed = false;

    if (existingLog) {
      db.prepare(`DELETE FROM habit_logs WHERE habit_id = ? AND completed_date = ?`).run(id, targetDate);
      completed = false;
    } else {
      const logId = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT INTO habit_logs (id, habit_id, completed_date, created_at)
        VALUES (?, ?, ?, ?)
      `).run(logId, id, targetDate, new Date().toISOString());
      completed = true;
    }

    // Recalculate streak
    const allLogs = db
      .prepare(`SELECT completed_date FROM habit_logs WHERE habit_id = ? ORDER BY completed_date DESC`)
      .all(id) as Array<{ completed_date: string }>;

    const logDatesSet = new Set(allLogs.map((l) => l.completed_date));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let currentStreak = 0;
    let checkDate = new Date();

    if (!logDatesSet.has(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    while (logDatesSet.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    const bestStreak = Math.max((habit.best_streak as number) || 0, currentStreak);

    db.prepare(`UPDATE habits SET streak = ?, best_streak = ? WHERE id = ?`).run(
      currentStreak,
      bestStreak,
      id
    );

    return NextResponse.json({
      completed,
      streak: currentStreak,
      bestStreak,
      completedDates: allLogs.map((l) => l.completed_date),
    });
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 });
  }
}
