'use client';

import React, { useEffect } from 'react';
import { QuickCaptureBar } from './QuickCaptureBar';
import { Task } from '@/types';
import { X, CheckSquare, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3.5 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 sm:pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#18181B] text-white">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#18181B]">
                Nueva Tarea
              </h3>
              <p className="text-[11px] text-[#475569]">
                Escribe en lenguaje natural o usa las opciones sugeridas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <QuickCaptureBar
          autoFocus={true}
          onTaskCreated={(task) => {
            if (onTaskCreated) onTaskCreated(task);
            onClose();
          }}
        />

        <div className="mt-4 flex items-center justify-between text-xs text-[#475569] border-t border-slate-100 pt-3">
          <span className="flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-[#059669]" />
            <span>Detecta fechas, horas, proyectos y prioridades automáticamente.</span>
          </span>
          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-medium">ESC</span>
        </div>
      </div>
    </div>
  );
}
