'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { QuickCaptureModal } from '@/components/quick-capture/QuickCaptureModal';
import { DailyPlanningModal } from '@/components/daily-planning/DailyPlanningModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isDailyPlanningOpen, setIsDailyPlanningOpen] = useState(false);

  useEffect(() => {
    // Check if initial tasks exist, otherwise auto-seed
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (!data.tasks || data.tasks.length === 0) {
          fetch('/api/seed', { method: 'POST' });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafbfc] text-zinc-900 antialiased flex flex-col">
        <ThemeProvider>
          <PomodoroProvider>
            {/* Global Header */}
            <Header
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onOpenDailyPlanning={() => setIsDailyPlanningOpen(true)}
            />

            {/* Layout Body: Sidebar + Main Content */}
            <div className="flex flex-1 w-full max-w-7xl mx-auto">
              <Sidebar
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                onOpenDailyPlanning={() => setIsDailyPlanningOpen(true)}
              />

              <main className="flex-1 p-4 sm:p-6 lg:p-7 pb-20 lg:pb-7 overflow-y-auto max-w-full">
                {children}
              </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />

            {/* Global Modals */}
            <QuickCaptureModal
              isOpen={isQuickCaptureOpen}
              onClose={() => setIsQuickCaptureOpen(false)}
              onTaskCreated={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
                }
              }}
            />

            <DailyPlanningModal
              isOpen={isDailyPlanningOpen}
              onClose={() => setIsDailyPlanningOpen(false)}
              onPlanningComplete={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
                }
              }}
            />
          </PomodoroProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
