'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Activity,
  Plus,
  Timer,
} from 'lucide-react';

interface BottomNavProps {
  onOpenQuickCapture: () => void;
}

export function BottomNav({ onOpenQuickCapture }: BottomNavProps) {
  const pathname = usePathname();

  const mainItems = [
    { label: 'Hoy', href: '/', icon: LayoutDashboard },
    { label: 'Tareas', href: '/tasks', icon: CheckSquare },
    { label: 'Calendario', href: '/calendar', icon: Calendar },
    { label: 'Hábitos', href: '/habits', icon: Activity },
    { label: 'Enfoque', href: '/focus', icon: Timer },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/80 bg-white/95 pb-safe backdrop-blur-lg">
      <div className="flex h-16 items-center justify-around px-2">
        {mainItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive ? 'text-[#18181B] font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-slate-100 text-[#18181B]' : ''
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Quick Add */}
        <div className="flex items-center justify-center -mt-6">
          <button
            onClick={onOpenQuickCapture}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18181B] text-white shadow-md active:scale-95 transition-transform"
            aria-label="Crear nueva tarea"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {mainItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive ? 'text-[#18181B] font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-slate-100 text-[#18181B]' : ''
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
