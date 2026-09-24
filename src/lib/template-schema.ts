export interface TemplateProject {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface TemplateHabit {
  name: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'weekdays' | 'weekends';
  icon?: string;
  color?: string;
  category?: string;
  targetDays?: number;
}

export interface TemplateSubtask {
  title: string;
  completed?: boolean;
}

export interface TemplateTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | number;
  dueDate?: string | null;
  dueTime?: string | null;
  estimatedMinutes?: number;
  projectName?: string;
  notes?: string;
  tags?: string[];
  subtasks?: Array<string | TemplateSubtask>;
}

export interface TemplateEvent {
  title: string;
  description?: string;
  date?: string; // "today", "+1d", "YYYY-MM-DD"
  startTime: string; // "09:00" or ISO
  endTime: string; // "11:00" or ISO
  isAllDay?: boolean;
  color?: string;
  projectName?: string;
  location?: string;
}

export interface TemplateNote {
  title: string;
  content: string;
  projectName?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface MrFocusTemplate {
  version: string;
  template: {
    name: string;
    description?: string;
    author?: string;
    tags?: string[];
    projects?: TemplateProject[];
    habits?: TemplateHabit[];
    tasks?: TemplateTask[];
    events?: TemplateEvent[];
    notes?: TemplateNote[];
  };
}

export function resolveTemplateDate(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  const lower = dueDate.toLowerCase().trim();

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    return lower;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lower === 'today') return formatDate(today);
  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }
  const relMatch = lower.match(/^\+(\d+)d$/);
  if (relMatch) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(relMatch[1], 10));
    return formatDate(d);
  }
  const iso = new Date(dueDate);
  if (!isNaN(iso.getTime())) return formatDate(iso);
  return null;
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function validateTemplate(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'El JSON debe ser un objeto.' };
  const obj = data as Record<string, unknown>;
  if (!obj.template || typeof obj.template !== 'object') return { valid: false, error: 'Falta la clave "template" en el JSON.' };
  const tmpl = obj.template as Record<string, unknown>;
  if (!tmpl.name || typeof tmpl.name !== 'string') return { valid: false, error: 'La plantilla debe tener un campo "name".' };
  return { valid: true };
}
