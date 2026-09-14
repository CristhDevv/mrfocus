import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageTask } from '../nlp-parser';
import { Project } from '@/types';
import { format, addDays } from 'date-fns';

describe('NLP Task Parser', () => {
  const sampleProjects: Project[] = [
    { id: 'proj_trabajo', name: 'Trabajo', color: '#3b82f6', icon: 'Briefcase' },
    { id: 'proj_finanzas', name: 'Finanzas', color: '#f59e0b', icon: 'CreditCard' },
    { id: 'proj_salud', name: 'Salud', color: '#10b981', icon: 'Activity' },
  ];

  it('should parse simple task title correctly and default priority to 4', () => {
    const res = parseNaturalLanguageTask('Comprar leche');
    expect(res.title).toBe('Comprar leche');
    expect(res.priority).toBe(4);
    expect(res.tags).toEqual([]);
  });

  it('should parse duration in various formats (~30m, ~1h, ~1.5h, ~45min)', () => {
    const res1 = parseNaturalLanguageTask('Revisar PR ~30m');
    expect(res1.title).toBe('Revisar PR');
    expect(res1.estimatedMinutes).toBe(30);

    const res2 = parseNaturalLanguageTask('Escribir artículo ~1h');
    expect(res2.title).toBe('Escribir artículo');
    expect(res2.estimatedMinutes).toBe(60);

    const res3 = parseNaturalLanguageTask('Sesión de estudio ~1.5h');
    expect(res3.title).toBe('Sesión de estudio');
    expect(res3.estimatedMinutes).toBe(90);

    const res4 = parseNaturalLanguageTask('Llamada rápida ~45min');
    expect(res4.title).toBe('Llamada rápida');
    expect(res4.estimatedMinutes).toBe(45);
  });

  it('should parse priority tokens (!p1, !p2, !p3, !p4, !urgente, !alta)', () => {
    const p1 = parseNaturalLanguageTask('Corregir bug en producción !p1');
    expect(p1.priority).toBe(1);

    const p1Alt = parseNaturalLanguageTask('Servidor caído !urgente');
    expect(p1Alt.priority).toBe(1);

    const p2 = parseNaturalLanguageTask('Actualizar dependencias !p2');
    expect(p2.priority).toBe(2);

    const p3 = parseNaturalLanguageTask('Organizar escritorio !p3');
    expect(p3.priority).toBe(3);

    const p4 = parseNaturalLanguageTask('Leer blog post !p4');
    expect(p4.priority).toBe(4);
  });

  it('should parse tags prefixed with #', () => {
    const res = parseNaturalLanguageTask('Desplegar backend #devops #deploy #infra');
    expect(res.title).toBe('Desplegar backend');
    expect(res.tags).toEqual(['devops', 'deploy', 'infra']);
  });

  it('should match projects prefixed with @', () => {
    const res = parseNaturalLanguageTask('Balance trimestral @finanzas', sampleProjects);
    expect(res.title).toBe('Balance trimestral');
    expect(res.projectId).toBe('proj_finanzas');
    expect(res.projectName).toBe('Finanzas');
  });

  it('should parse recurrence rules ("cada dia 1", "cada lunes", "todos los dias", "diario")', () => {
    const res1 = parseNaturalLanguageTask('Pagar renta cada dia 1');
    expect(res1.recurrenceRule).toBe('monthly:1');

    const res2 = parseNaturalLanguageTask('Revisión semanal cada lunes');
    expect(res2.recurrenceRule).toBe('weekly:lunes');

    const res3 = parseNaturalLanguageTask('Meditación todos los dias');
    expect(res3.recurrenceRule).toBe('daily');
  });

  it('should parse relative dates ("hoy", "mañana", "pasado mañana")', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const resToday = parseNaturalLanguageTask('Entrenar pierna hoy');
    expect(resToday.dueDate).toBe(todayStr);

    const resTomorrow = parseNaturalLanguageTask('Presentar demo mañana');
    expect(resTomorrow.dueDate).toBe(tomorrowStr);
  });

  it('should parse times ("15:30", "10am", "4pm", "a las 11:00")', () => {
    const res1 = parseNaturalLanguageTask('Reunión con cliente mañana a las 15:30');
    expect(res1.dueTime).toBe('15:30');

    const res2 = parseNaturalLanguageTask('Daily sync hoy 10am');
    expect(res2.dueTime).toBe('10:00');

    const res3 = parseNaturalLanguageTask('Cierre de sprint 4pm');
    expect(res3.dueTime).toBe('16:00');
  });

  it('should parse complex mixed natural language input correctly', () => {
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const res = parseNaturalLanguageTask(
      'Pagar factura de internet mañana a las 14:00 !p1 @finanzas ~20m #pagos #servicios',
      sampleProjects
    );

    expect(res.title).toBe('Pagar factura de internet');
    expect(res.dueDate).toBe(tomorrowStr);
    expect(res.dueTime).toBe('14:00');
    expect(res.priority).toBe(1);
    expect(res.projectId).toBe('proj_finanzas');
    expect(res.estimatedMinutes).toBe(20);
    expect(res.tags).toContain('pagos');
    expect(res.tags).toContain('servicios');
  });
});
