import { describe, it, expect } from 'vitest';
import { validateTemplate, resolveTemplateDate } from '../template-schema';

describe('Template Schema & Helpers', () => {
  it('validates a correct template structure', () => {
    const validData = {
      version: '1.0',
      template: {
        name: 'Rutina de Prueba',
        habits: [{ name: 'Hábito 1', frequency: 'daily' }],
        tasks: [{ title: 'Tarea 1', dueDate: 'today' }],
      },
    };
    const result = validateTemplate(validData);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects an invalid template without template key or name', () => {
    expect(validateTemplate(null).valid).toBe(false);
    expect(validateTemplate({}).valid).toBe(false);
    expect(validateTemplate({ template: {} }).valid).toBe(false);
  });

  it('resolves relative dates properly', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    expect(resolveTemplateDate('today')).toBe(todayStr);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    expect(resolveTemplateDate('tomorrow')).toBe(tomorrowStr);

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];
    expect(resolveTemplateDate('+3d')).toBe(in3DaysStr);

    expect(resolveTemplateDate('2026-10-15')).toBe('2026-10-15');
    expect(resolveTemplateDate(undefined)).toBeNull();
    expect(resolveTemplateDate(null)).toBeNull();
  });
});
