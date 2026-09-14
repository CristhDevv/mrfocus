'use client';

import React, { useEffect } from 'react';
import { QuickCaptureBar } from './QuickCaptureBar';
import { Task } from '@/types';
import { ArrowLeft, Sparkles, CheckSquare, X } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

export function QuickCaptureModal({
  isOpen,
  onClose,
  onTaskCreated,
}: QuickCaptureModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-y-auto animate-in fade-in duration-100">
      {/* Native Mobile Top Navigation Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181B] text-white">
            <CheckSquare className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[#18181B]">
            Nueva Tarea
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
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#18181B]">
              Captura Rápida de Tarea
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Escribe lo que tienes pendiente en lenguaje natural. Detecta automáticamente fechas, horas y prioridades.
            </p>
          </div>

          <QuickCaptureBar
            autoFocus={true}
            onTaskCreated={(task) => {
              if (onTaskCreated) onTaskCreated(task);
              onClose();
            }}
          />

          <div className="flex items-center space-x-2 rounded-xl bg-[#ecfdf5] p-3 text-xs text-[#059669] border border-[#a7f3d0]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              <strong>Tip:</strong> Puedes escribir frases como <em>&quot;Revisar informe mañana a las 3pm urgente&quot;</em> o <em>&quot;Pagar internet el día 5 cada mes&quot;</em>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

