# MrFocus — Minimalist All-in-One Productivity Platform

MrFocus is a modern, mobile-first, all-in-one productivity web application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons, and Supabase PostgreSQL.

## Features

- **NLP Quick Capture**: Natural language parsing for instant task creation with dates, times, recurrences, priorities (`!p1`), projects (`@proyecto`), tags (`#tag`), and time estimates (`~30m`).
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
```bash
npm test
```

## Production Build

```bash
npm run build
```

## Environment Variables

Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gguobcfciwcexnjbneik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
