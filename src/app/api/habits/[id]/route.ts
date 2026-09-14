import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    db.prepare(`DELETE FROM habit_logs WHERE habit_id = ?`).run(id);
    const res = db.prepare(`DELETE FROM habits WHERE id = ?`).run(id);

    if (res.changes === 0) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    ['name', 'icon', 'category', 'frequency', 'target_days_per_week'].forEach((key) => {
      const camelKey = key === 'target_days_per_week' ? 'targetDaysPerWeek' : key;
      if (body[camelKey] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[camelKey]);
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE habits SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}
