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
  Sparkles,
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
    { label: 'Mis Tareas', href: '/tasks', icon: CheckSquare },
    { label: 'Calendario', href: '/calendar', icon: Calendar },
    { label: 'Hábitos', href: '/habits', icon: Activity },
    { label: 'Temporizador', href: '/focus', icon: Timer },
    { label: 'Notas', href: '/notes', icon: FileText },
    { label: 'Estadísticas', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-4 shrink-0">
      <div className="space-y-5">
        {/* Quick Add Action Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#18181B] py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nueva Tarea</span>
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
                className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#18181B] text-white font-semibold shadow-xs'
                    : 'text-[#475569] hover:bg-slate-100 hover:text-[#18181B]'
                }`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Planning Helper */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={onOpenDailyPlanning}
          className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 px-3 text-xs font-semibold text-[#18181B] hover:bg-white hover:border-slate-300 transition-all shadow-xs"
        >
          <Sparkles className="h-4 w-4 text-[#059669]" />
          <span>Planificar mi Día</span>
        </button>
      </div>
    </aside>
  );
}
