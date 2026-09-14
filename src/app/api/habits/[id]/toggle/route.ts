import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    const { date } = await req.json();
    const habitId = params.id;
    const now = new Date().toISOString();

    const existingLog = db
      .prepare('SELECT * FROM habit_logs WHERE user_id = ? AND habit_id = ? AND completed_date = ?')
      .get(userId, habitId, date);

    if (existingLog) {
      db.prepare('DELETE FROM habit_logs WHERE user_id = ? AND habit_id = ? AND completed_date = ?').run(userId, habitId, date);
      try {
        await supabase.from('habit_logs').delete().eq('user_id', userId).eq('habit_id', habitId).eq('date', date);
      } catch (e) {
        console.warn('Supabase habit log delete error:', e);
      }
      return NextResponse.json({ toggled: false, date });
    } else {
      const logId = `hl_${habitId}_${date}`;
      db.prepare(
        'INSERT INTO habit_logs (id, user_id, habit_id, completed_date, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(logId, userId, habitId, date, now);

      try {
        await supabase.from('habit_logs').insert({
          id: logId,
          user_id: userId,
          habit_id: habitId,
          date,
          completed: true,
          created_at: now,
        });
      } catch (e) {
        console.warn('Supabase habit log insert error:', e);
      }
      return NextResponse.json({ toggled: true, date });
    }
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 });
  }
}
