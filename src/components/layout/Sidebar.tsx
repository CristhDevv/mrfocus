'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Activity,
  Timer,
  BarChart3,
  FileText,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  onOpenQuickCapture: () => void;
  onOpenDailyPlanning: () => void;
}

export function Sidebar({
  onOpenQuickCapture,
  onOpenDailyPlanning,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Hoy', href: '/', icon: LayoutDashboard },
    { label: 'Tareas', href: '/tasks', icon: CheckSquare },
    { label: 'Calendario', href: '/calendar', icon: Calendar },
    { label: 'Hábitos', href: '/habits', icon: Activity },
    { label: 'Enfoque', href: '/focus', icon: Timer },
    { label: 'Analíticas', href: '/analytics', icon: BarChart3 },
    { label: 'Notas', href: '/notes', icon: FileText },
  ];

  return (
    <aside className="hidden lg:flex w-60 flex-col justify-between border-r border-zinc-200/80 bg-white p-4 shrink-0">
      <div className="space-y-5">
        {/* Quick Add Action Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-zinc-900 py-2.5 px-3 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Nueva Tarea (NLP)</span>
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white font-medium shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Minimal Action */}
      <div className="border-t border-zinc-100 pt-3">
        <button
          onClick={onOpenDailyPlanning}
          className="flex w-full items-center justify-center space-x-2 rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span>Planificación Diaria</span>
        </button>
      </div>
    </aside>
  );
}
