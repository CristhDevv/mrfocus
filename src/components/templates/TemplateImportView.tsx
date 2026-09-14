'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Upload, FileJson, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Download, Copy, Activity, CheckSquare, Layers,
} from 'lucide-react';
import { validateTemplate, MrFocusTemplate } from '@/lib/template-schema';

const EXAMPLE_TEMPLATE = {
  version: '1.0',
  template: {
    name: 'Mi Rutina Semanal',
    description: 'Horario con hábitos de bienestar y tareas de productividad',
    author: 'Agente AI',
    projects: [
      { name: 'Salud y Fitness', color: '#059669', icon: 'Activity', description: 'Hábitos de ejercicio y bienestar' },
      { name: 'Aprendizaje', color: '#8b5cf6', icon: 'BookOpen', description: 'Cursos y lecturas' },
    ],
    habits: [
      { name: 'Meditar 10 minutos', frequency: 'daily', icon: 'Sun', color: '#f59e0b' },
      { name: 'Ejercicio 30 min', frequency: 'daily', icon: 'Activity', color: '#059669' },
      { name: 'Leer 20 páginas', frequency: 'daily', icon: 'BookOpen', color: '#8b5cf6' },
    ],
    tasks: [
      { title: 'Revisar correos y Slack', dueDate: 'today', priority: 'medium', projectName: 'Aprendizaje' },
      { title: 'Sesión de deep work (2h)', dueDate: 'today', priority: 'high' },
      { title: 'Revisar métricas semanales', dueDate: '+3d', priority: 'medium' },
    ],
  },
};

interface TemplateImportViewProps {
  onClose: () => void;
}

export function TemplateImportView({ onClose }: TemplateImportViewProps) {
  const [jsonText, setJsonText] = useState('');
  const [parsedTemplate, setParsedTemplate] = useState<MrFocusTemplate | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; created?: { projects: number; habits: number; tasks: number } } | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParseJson = (text: string) => {
    setJsonText(text);
    setParseError(null);
    setParsedTemplate(null);
    setImportResult(null);
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const validation = validateTemplate(parsed);
      if (!validation.valid) {
        setParseError(validation.error || 'JSON inválido');
        return;
      }
      setParsedTemplate(parsed as MrFocusTemplate);
    } catch {
      setParseError('El texto no es un JSON válido. Verifica la sintaxis.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleParseJson(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedTemplate) return;
    setImporting(true);
    try {
      const res = await fetch('/api/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedTemplate),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ success: true, message: data.message, created: data.created });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
        }
      } else {
        setImportResult({ success: false, message: data.error || 'Error al importar' });
      }
    } catch {
      setImportResult({ success: false, message: 'Error de conexión' });
    }
    setImporting(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/templates/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mrfocus-template.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(JSON.stringify(EXAMPLE_TEMPLATE, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tmpl = parsedTemplate?.template;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3.5">
        <button onClick={onClose} className="flex items-center space-x-2 text-xs font-semibold text-[#475569] hover:text-[#18181B]">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <h1 className="text-sm font-extrabold text-[#18181B]">Importar Plantilla</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#18181B] hover:bg-slate-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{exporting ? 'Exportando...' : 'Exportar'}</span>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-xl mx-auto w-full pb-20">

        {/* Instructions */}
        <div className="rounded-2xl border border-[#a7f3d0]/60 bg-[#ecfdf5] p-4 space-y-1.5">
          <p className="text-xs font-bold text-[#059669]">¿Cómo usar esto?</p>
          <ol className="text-xs font-medium text-[#059669]/80 space-y-1 list-decimal list-inside">
            <li>Copia el ejemplo de plantilla de abajo</li>
            <li>Pégaselo a un agente AI y pídele que lo rellene con tu horario ideal</li>
            <li>Pega el JSON resultado aquí y presiona "Importar Todo"</li>
          </ol>
        </div>

        {/* Example collapse */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowExample(!showExample)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold text-[#18181B] hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <FileJson className="h-4 w-4 text-[#475569]" />
              <span>Ver formato de plantilla de ejemplo</span>
            </div>
            {showExample ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showExample && (
            <div className="border-t border-slate-100">
              <div className="relative">
                <pre className="text-[10px] font-mono text-slate-600 p-4 overflow-x-auto bg-slate-50/60 max-h-64">
                  {JSON.stringify(EXAMPLE_TEMPLATE, null, 2)}
                </pre>
                <button
                  onClick={handleCopyExample}
                  className="absolute top-2 right-2 flex items-center space-x-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-[#18181B] hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="px-4 pb-3.5">
                <p className="text-[10px] text-[#475569] font-medium">
                  <strong>Fechas relativas:</strong> "today", "tomorrow", "+3d", "+7d" o fecha ISO "2026-09-20"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* JSON Input */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#18181B]">Pega tu plantilla aquí</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-[#475569] hover:bg-white transition-colors"
            >
              <Upload className="h-3 w-3" />
              <span>Subir archivo .json</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => handleParseJson(e.target.value)}
            placeholder='{ "version": "1.0", "template": { "name": "Mi Rutina", ... } }'
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-[11px] font-mono text-[#18181B] focus:border-[#18181B] focus:outline-none resize-none transition-all"
            rows={8}
            spellCheck={false}
          />

          {parseError && (
            <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose-700">{parseError}</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {parsedTemplate && tmpl && !importResult && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="pb-2.5 border-b border-slate-100">
              <p className="text-xs font-extrabold text-[#18181B]">{tmpl.name}</p>
              {tmpl.description && <p className="text-[11px] text-[#475569] mt-0.5">{tmpl.description}</p>}
            </div>

            {(tmpl.projects || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569] flex items-center space-x-1.5">
                  <Layers className="h-3 w-3" /><span>Proyectos ({tmpl.projects!.length})</span>
                </p>
                {tmpl.projects!.map((p, i) => (
                  <div key={i} className="flex items-center space-x-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#475569' }} />
                    <span className="text-xs font-medium text-[#18181B]">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {(tmpl.habits || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569] flex items-center space-x-1.5">
                  <Activity className="h-3 w-3" /><span>Hábitos ({tmpl.habits!.length})</span>
                </p>
                {tmpl.habits!.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color || '#059669' }} />
                    <span className="text-xs font-medium text-[#18181B]">{h.name}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{h.frequency || 'diario'}</span>
                  </div>
                ))}
              </div>
            )}

            {(tmpl.tasks || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569] flex items-center space-x-1.5">
                  <CheckSquare className="h-3 w-3" /><span>Tareas ({tmpl.tasks!.length})</span>
                </p>
                {tmpl.tasks!.map((t, i) => (
                  <div key={i} className="flex items-center space-x-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <span className="text-xs font-medium text-[#18181B] flex-1">{t.title}</span>
                    {t.dueDate && <span className="text-[10px] font-bold text-[#475569] bg-slate-200 rounded-md px-1.5 py-0.5">{t.dueDate}</span>}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-[#18181B] py-3 text-xs font-bold text-white hover:bg-[#27272a] active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {importing ? (
                <span>Importando...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Importar Todo</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {importResult && (
          <div className={`rounded-2xl border p-5 space-y-3 ${importResult.success ? 'border-[#a7f3d0] bg-[#ecfdf5]' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-center space-x-2">
              {importResult.success
                ? <CheckCircle2 className="h-5 w-5 text-[#059669]" />
                : <AlertCircle className="h-5 w-5 text-rose-500" />
              }
              <p className={`text-sm font-bold ${importResult.success ? 'text-[#059669]' : 'text-rose-700'}`}>
                {importResult.success ? 'Importación exitosa' : 'Error en la importación'}
              </p>
            </div>
            <p className={`text-xs font-medium ${importResult.success ? 'text-[#059669]/80' : 'text-rose-600'}`}>
              {importResult.message}
            </p>
            {importResult.success && (
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-[#059669] py-2.5 text-xs font-bold text-white hover:bg-[#047857] transition-colors"
              >
                Ver mi espacio actualizado
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
