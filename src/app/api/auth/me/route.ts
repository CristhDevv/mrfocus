import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  return NextResponse.json({ user });
}
