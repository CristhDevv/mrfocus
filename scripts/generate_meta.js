const fs = require('fs');

// .gitignore
const gitignore = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/dist

# Misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vercel

# Local env files
.env*.local
data/*.db
`;
fs.writeFileSync('.gitignore', gitignore);

// .env.example
const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gguobcfciwcexnjbneik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`;
fs.writeFileSync('.env.example', envExample);

// supabase/schema.sql
if (!fs.existsSync('supabase')) fs.mkdirSync('supabase');
const schemaSql = `-- ==========================================================
-- MrFocus Database Schema for Supabase PostgreSQL
-- ==========================================================

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'Folder',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TEXT,
  due_time TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  recurrence_rule TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0
);

-- 3. Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  category TEXT NOT NULL DEFAULT 'work',
  location TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Habits
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_days JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb,
  target_per_day INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'health',
  color TEXT NOT NULL DEFAULT '#10b981',
  icon TEXT NOT NULL DEFAULT 'Activity',
  streak_days INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Time Sessions (Pomodoro & Focus)
CREATE TABLE IF NOT EXISTS time_sessions (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'focus',
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects access" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public tasks access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public subtasks access" ON subtasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public calendar_events access" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public habits access" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public habit_logs access" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public time_sessions access" ON time_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public notes access" ON notes FOR ALL USING (true) WITH CHECK (true);
`;
fs.writeFileSync('supabase/schema.sql', schemaSql);

// README.md
const readme = `# MrFocus — Minimalist All-in-One Productivity Platform

MrFocus is a modern, mobile-first, all-in-one productivity web application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons, and Supabase PostgreSQL.

## Features

- **NLP Quick Capture**: Natural language parsing for instant task creation with dates, times, recurrences, priorities (\`!p1\`), projects (\`@proyecto\`), tags (\`#tag\`), and time estimates (\`~30m\`).
- **Task Management**: List and Kanban views, subtasks, priorities, project grouping, and multi-filter capabilities.
- **Integrated Calendar & Time Blocking**: Multi-view calendar (Day, Week, Month) with drag-and-drop scheduling and unified event/task views.
- **Morning Guided Planning**: Interactive flow to review backlog, estimate durations, auto-schedule into available calendar slots, and commit the daily plan.
- **Smart Auto-Scheduler**: Constraint satisfaction algorithm for automated task placement respecting working hours, lunch breaks, and existing commitments.
- **Focus Timer**: Configurable Pomodoro and Stopwatch modes with sound feedback and task session tracking.
- **Habit Tracker**: Minimalist check-ins, streaks, and 90-day consistency heatmap visualizations.
- **Markdown Notes**: Rich markdown editor with project/task linking and tag filtering.
- **Analytics Dashboard**: Completion rates, focus time metrics, velocity, and productivity trends.
- **Design System**: Ultra-clean, distraction-free minimalist light theme with zero emojis and zero gamification.
- **Database Architecture**: Powered by Supabase PostgreSQL with local SQLite fallback for resilient offline capabilities.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (Zero emojis)
- **Database**: Supabase PostgreSQL & SQLite (better-sqlite3)
- **Testing**: Vitest (16 unit tests covering NLP parsing, auto-scheduler, and date utilities)

## Unit Tests

Run the test suite:
\`\`\`bash
npm test
\`\`\`

## Production Build

\`\`\`bash
npm run build
\`\`\`

## Environment Variables

Create \`.env.local\` with your Supabase credentials:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://gguobcfciwcexnjbneik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`
`;
fs.writeFileSync('README.md', readme);

console.log('Static metadata files generated successfully.');
