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
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-zinc-200 bg-white/95 pb-safe backdrop-blur-lg">
      <div className="flex h-14 items-center justify-around px-2">
        {mainItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Quick Add */}
        <div className="flex items-center justify-center -mt-5">
          <button
            onClick={onOpenQuickCapture}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md active:scale-95 transition-transform"
            aria-label="Captura rápida"
          >
            <Plus className="h-5 w-5 stroke-[2]" />
          </button>
        </div>

        {mainItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
