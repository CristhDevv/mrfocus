import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : 'default_user';

    db.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(params.id);
    db.prepare('DELETE FROM habits WHERE id = ?').run(params.id);

    try {
      await supabase.from('habit_logs').delete().eq('habit_id', params.id);
      await supabase.from('habits').delete().eq('id', params.id);
    } catch (e) {
      console.warn('Supabase habit delete notice:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
