import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockImplementation((tableName: string) => {
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'proj_1', name: 'Test' }],
              error: null,
              count: 1,
            }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { ping_count: 5 },
                error: null,
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      }),
    },
  };
});

import { GET, POST } from '@/app/api/keep-alive/route';

describe('Keep-Alive API Route Handler', () => {
  it('GET /api/keep-alive returns a healthy JSON response with 200 status', async () => {
    const req = new NextRequest('https://mrfocus.vercel.app/api/keep-alive', {
      headers: {
        'x-vercel-cron': '1',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.supabase.healthy).toBe(true);
    expect(body.supabase.readSuccess).toBe(true);
    expect(body.supabase.writeSuccess).toBe(true);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('latencyMs');
  });

  it('POST /api/keep-alive handles external cron pings correctly', async () => {
    const req = new NextRequest('https://mrfocus.vercel.app/api/keep-alive', {
      method: 'POST',
      headers: {
        'user-agent': 'github-actions-keep-alive/1.0',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.supabase.healthy).toBe(true);
  });
});
