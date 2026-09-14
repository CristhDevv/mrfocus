'use client';

import React, { useEffect } from 'react';
import { QuickCaptureBar } from './QuickCaptureBar';
import { Task } from '@/types';
import { X, CheckSquare } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 pt-20 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-zinc-800" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Captura Rápida
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <QuickCaptureBar
          autoFocus={true}
          onTaskCreated={(task) => {
            if (onTaskCreated) onTaskCreated(task);
            onClose();
          }}
        />

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Lenguaje natural: fechas, prioridades (!p1), proyectos (@) y etiquetas (#).</span>
          <span>ESC para cerrar</span>
        </div>
      </div>
    </div>
  );
}
