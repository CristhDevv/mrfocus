'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Plus,
  UserPlus,
  Users,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Shield,
  Trash2,
  Key,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { format } from 'date-fns';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function AdminUserModal({ isOpen, onClose }: AdminUserModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'superadmin'>('user');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.role === 'superadmin') {
      loadUsers();
    }
  }, [isOpen, user]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('¡Usuario ' + data.user.email + ' creado con éxito! Ya puede iniciar sesión directamente.');
        setName('');
        setEmail('');
        setPassword('');
        setRole('user');
        loadUsers();
      } else {
        setErrorMsg(data.error || 'Error al crear el usuario');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-y-auto animate-in fade-in duration-100">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a la App</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181B] text-white">
            <ShieldAlert className="h-4 w-4 text-[#059669]" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[#18181B]">
            Panel de Superadmin — Creación de Usuarios
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Screen Body */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-lg bg-[#ecfdf5] px-2.5 py-0.5 text-xs font-bold text-[#059669]">
              <Shield className="h-3.5 w-3.5" />
              <span>Acceso Superadmin Activo</span>
            </div>
            <h1 className="text-lg font-extrabold text-[#18181B] mt-2">
              Gestión y Creación Directa de Cuentas
            </h1>
            <p className="text-xs text-[#475569] mt-0.5 font-medium">
              Crea usuarios con su correo y contraseña para que puedan acceder de inmediato sin confirmación por correo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#27272a] transition-all shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isFormOpen ? 'Ocultar Formulario' : 'Crear Nuevo Usuario'}</span>
          </button>
        </div>

        {/* Create User Form Card */}
        {isFormOpen && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#18181B] flex items-center space-x-2">
                <UserPlus className="h-4 w-4 text-[#059669]" />
                <span>Crear Nuevo Usuario</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                El usuario podrá iniciar sesión inmediatamente con estas credenciales.
              </p>
            </div>

            {successMsg && (
              <div className="flex items-center space-x-2 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-xs font-semibold text-[#059669]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Nombre del Usuario
                  </label>
                  <div className="relative mt-1">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Carlos Gómez"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
                    />
                  </div>
                </div>

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
                      placeholder="usuario@ejemplo.com"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Contraseña de Acceso
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña inicial del usuario"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Rol del Usuario
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 px-3.5 text-xs sm:text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:border-[#18181B] transition-all"
                  >
                    <option value="user">Usuario Estándar (Entorno Privado Aislado)</option>
                    <option value="superadmin">Superadmin (Acceso a Crear Usuarios)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#27272a] transition-all disabled:opacity-50 active:scale-95"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{isSubmitting ? 'Creando...' : 'Crear Usuario Inmediatamente'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Users List */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#18181B] flex items-center space-x-2">
              <Users className="h-4 w-4 text-[#18181B]" />
              <span>Usuarios Registrados ({users.length})</span>
            </h3>
            <button
              onClick={loadUsers}
              className="text-xs font-semibold text-[#059669] hover:underline"
            >
              Actualizar Lista
            </button>
          </div>

          <div className="space-y-2.5">
            {users.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">
                {isLoading ? 'Cargando usuarios...' : 'No hay usuarios adicionales registrados.'}
              </p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5 text-xs transition-all hover:bg-white hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18181B] text-white font-bold shrink-0">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#18181B] truncate">{u.name}</span>
                        <span
                          className={"rounded-md px-1.5 py-0.2 text-[10px] font-bold " + (
                            u.role === 'superadmin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200/80 text-slate-700'
                          )}
                        >
                          {u.role === 'superadmin' ? 'Superadmin' : 'Usuario'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#475569] font-medium truncate block">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                      {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy') : ''}
                    </span>
                    <span className="inline-flex items-center space-x-1 rounded-lg bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold text-[#059669]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Activo</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
