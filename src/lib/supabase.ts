import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gguobcfciwcexnjbneik.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndW9iY2ZjaXdjZXhuamJuZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTEyNjgsImV4cCI6MjEwNDk2NzI2OH0.V01Cr131zioHdKZeRHbT0ydEbhW-_9c9o516vy-LRNA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
