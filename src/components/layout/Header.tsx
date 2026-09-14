'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePomodoro } from '../pomodoro/PomodoroContext';
import { useAuth } from '../auth/AuthContext';
import {
  CheckSquare,
  Bell,
  Play,
  Pause,
  Timer,
  Search,
  Calendar,
  Layers,
  Plus,
  LogOut,
  ShieldAlert,
  Shield,
  UserPlus,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickCapture: () => void;
  onOpenDailyPlanning: () => void;
  onOpenAdmin?: () => void;
}

export function Header({
  onOpenQuickCapture,
  onOpenDailyPlanning,
  onOpenAdmin,
}: HeaderProps) {
  const { isRunning, timeLeft, startTimer, pauseTimer, formatTime } = usePomodoro();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-2.5">
          <Link href="/" className="group flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs transition-transform duration-200 group-hover:scale-105 overflow-hidden p-1">
              <img
                src="/logo-icon.png"
                alt="Mr. Focus"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-[#18181B] leading-none">
                mr focus
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#475569] mt-0.5 hidden sm:block leading-none">
                Enfócate. Logra. Repite.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search & Quick Capture Bar Trigger (Desktop/Tablet) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-3 sm:mx-6">
          <button
            onClick={onOpenQuickCapture}
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#475569] transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
              <span className="truncate font-normal text-slate-600">
                Escribe una tarea o pulsa para capturar...
              </span>
            </div>
            <span className="hidden md:inline-flex items-center rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              + Nueva
            </span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Superadmin Button */}
          {isSuperadmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
              title="Crear y administrar usuarios"
            >
              <UserPlus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Crear Usuarios</span>
            </button>
          )}

          {/* Quick Add Button (Desktop) */}
          <button
            onClick={onOpenQuickCapture}
            className="hidden md:inline-flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Crear Tarea</span>
          </button>

          {/* Daily Planning Button (Desktop/Tablet) */}
          <button
            onClick={onOpenDailyPlanning}
            className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-[#18181B] hover:bg-slate-50 transition-colors shadow-xs"
            title="Planificación diaria matutina guiada"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden md:inline">Planificar Día</span>
          </button>

          {/* Active Focus Timer Pill */}
          <div className={"flex items-center rounded-xl border px-2.5 py-1.5 sm:px-3 text-xs font-medium transition-all " + (
            isRunning
              ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669] shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          )}>
            <Link href="/focus" className="flex items-center space-x-1.5 hover:text-[#18181B]">
              <Timer className={"h-3.5 w-3.5 " + (isRunning ? "animate-pulse text-[#059669]" : "text-slate-400")} />
              <span className={"font-mono text-xs sm:text-xs font-semibold " + (isRunning ? "text-[#059669]" : "text-slate-800")}>
                {formatTime(timeLeft)}
              </span>
            </Link>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className={"ml-1.5 sm:ml-2 " + (isRunning ? "text-[#059669] hover:text-[#047857]" : "text-slate-500 hover:text-slate-900")}
              title={isRunning ? "Pausar temporizador" : "Iniciar temporizador"}
            >
              {isRunning ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
                setHasUnread(false);
              }}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Notificaciones"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#059669] ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-[#18181B]">Notificaciones</h4>
                </div>
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  <div className="flex items-start space-x-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <Layers className="h-4 w-4 text-[#059669] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#18181B]">Planificación diaria disponible</p>
                      <p className="text-[11px] text-[#475569]">Revisa tu lista y organiza tus bloques de tiempo con calma.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-50 transition-all"
              title="Perfil y Entorno"
            >
              <div className={"flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold " + (
                isSuperadmin ? "bg-amber-500" : "bg-[#18181B]"
              )}>
                {initialLetter}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#18181B] max-w-[100px] truncate leading-tight">
                  {user?.name || 'Usuario'}
                </span>
                {isSuperadmin && (
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider leading-none">
                    Superadmin
                  </span>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl z-50 space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={"flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm " + (
                      isSuperadmin ? "bg-amber-500" : "bg-[#18181B]"
                    )}>
                      {initialLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#18181B] truncate">{user?.name}</h4>
                      <p className="text-[11px] text-[#475569] truncate font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div className={"mt-2.5 inline-flex items-center space-x-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold " + (
                    isSuperadmin
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-[#ecfdf5] text-[#059669]"
                  )}>
                    <Shield className="h-3 w-3" />
                    <span>{isSuperadmin ? 'Rol: Superadmin' : 'Entorno Privado Activo'}</span>
                  </div>
                </div>

                {isSuperadmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center space-x-2 rounded-xl bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-amber-600" />
                    <span>Crear / Gestionar Usuarios</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
