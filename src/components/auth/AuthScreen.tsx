'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AuthScreen() {
  const { login, register, guestLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'register') {
      const res = await register(name, email, password);
      if (!res.success) {
        setError(res.error || 'Error al registrar la cuenta');
      }
    } else {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Credenciales inválidas');
      }
    }

    setIsSubmitting(false);
  };

  const handleGuest = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await guestLogin();
    if (!res.success) {
      setError(res.error || 'Error al iniciar como invitado');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#18181B] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#18181B] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18181B] text-white shadow-xs">
            <Sparkles className="h-6 w-6 text-[#059669]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#18181B]">
            MrFocus
          </h1>
          <p className="text-xs text-[#475569] font-medium max-w-xs mx-auto">
            Tu espacio privado de productividad personal y enfoque continuo
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#475569] hover:text-[#18181B]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#475569] hover:text-[#18181B]'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Nombre Completo
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre o apodo"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:border-[#18181B] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Correo Electrónico
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:border-[#18181B] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Contraseña
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:border-[#18181B] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-[#18181B] py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-[#27272a] active:scale-[0.99] disabled:opacity-50"
            >
              <span>{mode === 'login' ? 'Entrar a mi Espacio' : 'Registrar y Empezar'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400">
              o pruébalo al instante
            </span>
          </div>

          {/* Quick Guest Access */}
          <button
            type="button"
            onClick={handleGuest}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 text-xs font-bold text-[#18181B] hover:bg-white hover:border-slate-300 transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="h-4 w-4 text-[#059669]" />
            <span>Crear Entorno Privado Rápido (Invitado)</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="flex items-center justify-center space-x-4 text-[11px] font-medium text-slate-400">
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
            <span>Datos 100% aislados</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
            <span>Sincronización segura</span>
          </span>
        </div>
      </div>
    </div>
  );
}
