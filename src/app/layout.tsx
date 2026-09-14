'use client';

import React, { useState } from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroContext';
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { QuickCaptureModal } from '@/components/quick-capture/QuickCaptureModal';
import { DailyPlanningModal } from '@/components/daily-planning/DailyPlanningModal';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isDailyPlanningOpen, setIsDailyPlanningOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#18181B] border-t-transparent" />
          <span className="text-xs font-semibold text-[#475569]">Cargando tu espacio privado...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
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

        <main className="flex-1 p-3.5 sm:p-6 lg:p-7 pb-28 lg:pb-7 overflow-y-auto max-w-full">
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
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] text-[#18181B] antialiased flex flex-col font-sans selection:bg-[#18181B] selection:text-white">
        <AuthProvider>
          <ThemeProvider>
            <PomodoroProvider>
              <AppContent>{children}</AppContent>
            </PomodoroProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
