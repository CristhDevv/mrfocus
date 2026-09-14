import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { format, subDays, addDays } from 'date-fns';

export async function POST() {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. Clear local DB
    db.prepare('DELETE FROM subtasks').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM calendar_events').run();
    db.prepare('DELETE FROM habit_logs').run();
    db.prepare('DELETE FROM habits').run();
    db.prepare('DELETE FROM time_sessions').run();
    db.prepare('DELETE FROM notes').run();
    db.prepare('DELETE FROM projects').run();

    // 2. Clear Supabase DB
    try {
      await supabase.from('subtasks').delete().neq('id', '0');
      await supabase.from('tasks').delete().neq('id', '0');
      await supabase.from('calendar_events').delete().neq('id', '0');
      await supabase.from('habit_logs').delete().neq('id', '0');
      await supabase.from('habits').delete().neq('id', '0');
      await supabase.from('time_sessions').delete().neq('id', '0');
      await supabase.from('notes').delete().neq('id', '0');
      await supabase.from('projects').delete().neq('id', '0');
    } catch (e) {
      console.warn('Supabase cleanup notice:', e);
    }

    // 3. Projects
    const projects = [
      { id: 'proj_trabajo', name: 'Trabajo & Desarrollo', color: '#3b82f6', icon: 'Briefcase', description: 'Proyectos profesionales y desarrollo de software' },
      { id: 'proj_personal', name: 'Personal & Hogar', color: '#10b981', icon: 'User', description: 'Gestiones del hogar, salud y bienestar' },
      { id: 'proj_finanzas', name: 'Finanzas', color: '#f59e0b', icon: 'CreditCard', description: 'Inversiones, pagos recurrentes y contabilidad' },
      { id: 'proj_estudio', name: 'Aprendizaje', color: '#8b5cf6', icon: 'BookOpen', description: 'Cursos, lecturas y nuevas tecnologías' },
    ];

    const insertProject = db.prepare(
      'INSERT INTO projects (id, name, color, icon, description, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (const p of projects) {
      insertProject.run(p.id, p.name, p.color, p.icon, p.description, new Date().toISOString());
    }
    await supabase.from('projects').insert(projects.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      icon: p.icon,
      description: p.description,
      created_at: new Date().toISOString()
    })));

    // 4. Tasks & Subtasks
    const sampleTasks = [
      {
        id: 'task_1',
        title: 'Preparar presentación para el Sprint Review',
        description: 'Compilar métricas de velocidad, demos de las nuevas funcionalidades y feedback del equipo',
        projectId: 'proj_trabajo',
        priority: 1,
        status: 'in_progress',
        dueDate: todayStr,
        dueTime: '16:00',
        estimatedMinutes: 60,
        actualMinutes: 30,
        tags: ['sprint', 'demo', 'urgente'],
        scheduledStart: `${todayStr}T10:00:00.000Z`,
        scheduledEnd: `${todayStr}T11:00:00.000Z`,
        subtasks: [
          { id: 'sub_1_1', title: 'Extraer capturas de pantalla de la interfaz', completed: true },
          { id: 'sub_1_2', title: 'Generar diapositivas de resumen', completed: true },
          { id: 'sub_1_3', title: 'Validar métricas con el equipo de producto', completed: false },
        ],
      },
      {
        id: 'task_2',
        title: 'Pagar renta y servicios del mes',
        description: 'Transferencia bancaria de alquiler y recibo de suministros',
        projectId: 'proj_finanzas',
        priority: 1,
        status: 'todo',
        dueDate: todayStr,
        dueTime: '12:00',
        estimatedMinutes: 20,
        actualMinutes: 0,
        tags: ['finanzas', 'pagos'],
        recurrenceRule: 'monthly:1',
        scheduledStart: `${todayStr}T11:15:00.000Z`,
        scheduledEnd: `${todayStr}T11:35:00.000Z`,
        subtasks: [
          { id: 'sub_2_1', title: 'Descargar comprobante bancario', completed: false },
          { id: 'sub_2_2', title: 'Enviar recibo por correo', completed: false },
        ],
      },
      {
        id: 'task_3',
        title: 'Refactorizar módulo de autenticación con OAuth',
        description: 'Migrar endpoints legacy y añadir rate limiting en la API',
        projectId: 'proj_trabajo',
        priority: 2,
        status: 'todo',
        dueDate: format(addDays(today, 1), 'yyyy-MM-dd'),
        dueTime: '18:00',
        estimatedMinutes: 90,
        actualMinutes: 0,
        tags: ['backend', 'seguridad', 'oauth'],
        subtasks: [
          { id: 'sub_3_1', title: 'Auditar tokens JWT expirados', completed: true },
          { id: 'sub_3_2', title: 'Implementar middleware de verificación', completed: false },
          { id: 'sub_3_3', title: 'Añadir tests de integración', completed: false },
        ],
      },
      {
        id: 'task_4',
        title: 'Completar módulo 4 del curso de Arquitectura Cloud',
        description: 'Patrones de microservicios y mensajería distribuida',
        projectId: 'proj_estudio',
        priority: 3,
        status: 'todo',
        dueDate: format(addDays(today, 2), 'yyyy-MM-dd'),
        dueTime: '20:00',
        estimatedMinutes: 45,
        actualMinutes: 0,
        tags: ['cloud', 'arquitectura'],
        subtasks: [
          { id: 'sub_4_1', title: 'Mirar videos de patrones saga', completed: false },
          { id: 'sub_4_2', title: 'Completar laboratorio práctico', completed: false },
        ],
      },
      {
        id: 'task_5',
        title: 'Revisión médica anual y exámenes de laboratorio',
        description: 'Agendar cita con especialista y recoger resultados previos',
        projectId: 'proj_personal',
        priority: 2,
        status: 'todo',
        dueDate: format(addDays(today, 3), 'yyyy-MM-dd'),
        dueTime: '09:00',
        estimatedMinutes: 30,
        actualMinutes: 0,
        tags: ['salud', 'citas'],
        subtasks: [],
      },
      {
        id: 'task_6',
        title: 'Diseñar arquitectura de caché con Redis',
        description: 'Optimizar tiempos de respuesta en consultas de alta frecuencia',
        projectId: 'proj_trabajo',
        priority: 2,
        status: 'done',
        dueDate: format(subDays(today, 1), 'yyyy-MM-dd'),
        dueTime: '17:00',
        estimatedMinutes: 45,
        actualMinutes: 45,
        tags: ['devops', 'infra'],
        completedAt: format(subDays(today, 1), "yyyy-MM-dd'T'16:30:00.000'Z'"),
        subtasks: [
          { id: 'sub_6_1', title: 'Configurar clúster de pruebas', completed: true },
          { id: 'sub_6_2', title: 'Medir latencia p99', completed: true },
        ],
      }
    ];

    const insertTask = db.prepare(
      `INSERT INTO tasks (
        id, title, description, project_id, priority, status,
        due_date, due_time, estimated_minutes, actual_minutes,
        tags, recurrence_rule, scheduled_start, scheduled_end,
        notes, created_at, completed_at, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertSubtask = db.prepare(
      'INSERT INTO subtasks (id, task_id, title, completed, order_index) VALUES (?, ?, ?, ?, ?)'
    );

    const tasksForSupabase: any[] = [];
    const subtasksForSupabase: any[] = [];

    sampleTasks.forEach((t, idx) => {
      insertTask.run(
        t.id,
        t.title,
        t.description,
        t.projectId,
        t.priority,
        t.status,
        t.dueDate,
        t.dueTime,
        t.estimatedMinutes,
        t.actualMinutes,
        JSON.stringify(t.tags),
        t.recurrenceRule || null,
        t.scheduledStart || null,
        t.scheduledEnd || null,
        '',
        new Date().toISOString(),
        t.completedAt || null,
        idx
      );

      tasksForSupabase.push({
        id: t.id,
        title: t.title,
        description: t.description,
        project_id: t.projectId,
        priority: t.priority,
        status: t.status,
        due_date: t.dueDate,
        due_time: t.dueTime,
        estimated_minutes: t.estimatedMinutes,
        actual_minutes: t.actualMinutes,
        tags: t.tags,
        recurrence_rule: t.recurrenceRule || null,
        scheduled_start: t.scheduledStart || null,
        scheduled_end: t.scheduledEnd || null,
        notes: '',
        created_at: new Date().toISOString(),
        completed_at: t.completedAt || null,
        order_index: idx
      });

      t.subtasks.forEach((sub, sIdx) => {
        insertSubtask.run(sub.id, t.id, sub.title, sub.completed ? 1 : 0, sIdx);
        subtasksForSupabase.push({
          id: sub.id,
          task_id: t.id,
          title: sub.title,
          completed: sub.completed,
          order_index: sIdx,
          created_at: new Date().toISOString()
        });
      });
    });

    await supabase.from('tasks').insert(tasksForSupabase);
    if (subtasksForSupabase.length > 0) {
      await supabase.from('subtasks').insert(subtasksForSupabase);
    }

    // 5. Calendar Events
    const calendarEvents = [
      {
        id: 'event_1',
        title: 'Daily Standup Sync',
        description: 'Sincronización diaria del equipo de ingeniería',
        startTime: `${todayStr}T09:00:00.000Z`,
        endTime: `${todayStr}T09:30:00.000Z`,
        isAllDay: false,
        color: '#3b82f6',
        category: 'meeting',
      },
      {
        id: 'event_2',
        title: 'Revisión de Arquitectura Técnica',
        description: 'Discusión sobre migración de base de datos a Supabase',
        startTime: `${todayStr}T14:00:00.000Z`,
        endTime: `${todayStr}T15:00:00.000Z`,
        isAllDay: false,
        color: '#8b5cf6',
        category: 'work',
      },
      {
        id: 'event_3',
        title: 'Planificación Semanal de Objetivos',
        description: 'Alineación de prioridades y backlog',
        startTime: `${format(addDays(today, 1), 'yyyy-MM-dd')}T10:00:00.000Z`,
        endTime: `${format(addDays(today, 1), 'yyyy-MM-dd')}T11:00:00.000Z`,
        isAllDay: false,
        color: '#10b981',
        category: 'planning',
      },
    ];

    const insertEvent = db.prepare(
      'INSERT INTO calendar_events (id, title, description, start_time, end_time, is_all_day, color, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    calendarEvents.forEach((ev) => {
      insertEvent.run(ev.id, ev.title, ev.description, ev.startTime, ev.endTime, ev.isAllDay ? 1 : 0, ev.color, ev.category, new Date().toISOString());
    });

    await supabase.from('calendar_events').insert(calendarEvents.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start_time: ev.startTime,
      end_time: ev.endTime,
      is_all_day: ev.isAllDay,
      color: ev.color,
      category: ev.category,
      created_at: new Date().toISOString()
    })));

    // 6. Habits & 90-Day Logs
    const habits = [
      {
        id: 'habit_1',
        title: 'Lectura de Desarrollo',
        description: '20 minutos de lectura técnica o libros de arquitectura',
        frequency: 'daily',
        targetDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        targetPerDay: 1,
        category: 'study',
        color: '#3b82f6',
        icon: 'BookOpen',
        streakDays: 14,
        bestStreak: 21,
      },
      {
        id: 'habit_2',
        title: 'Ejercicio y Movilidad',
        description: '30 a 45 minutos de entrenamiento o estiramiento',
        frequency: 'daily',
        targetDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        targetPerDay: 1,
        category: 'health',
        color: '#10b981',
        icon: 'Activity',
        streakDays: 8,
        bestStreak: 12,
      },
      {
        id: 'habit_3',
        title: 'Planificación Matutina',
        description: 'Organizar backlog y time-blocking en MrFocus',
        frequency: 'daily',
        targetDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        targetPerDay: 1,
        category: 'productivity',
        color: '#f59e0b',
        icon: 'Calendar',
        streakDays: 5,
        bestStreak: 15,
      },
      {
        id: 'habit_4',
        title: 'Mindfulness y Enfoque',
        description: '10 minutos de respiración consciente antes de iniciar',
        frequency: 'daily',
        targetDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        targetPerDay: 1,
        category: 'health',
        color: '#8b5cf6',
        icon: 'Sun',
        streakDays: 19,
        bestStreak: 25,
      },
    ];

    const insertHabit = db.prepare(
      'INSERT INTO habits (id, title, description, frequency, target_days, target_per_day, category, color, icon, streak_days, best_streak, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const insertHabitLog = db.prepare(
      'INSERT INTO habit_logs (id, habit_id, date, count, completed, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const habitLogsForSupabase: any[] = [];

    habits.forEach((h) => {
      insertHabit.run(h.id, h.title, h.description, h.frequency, JSON.stringify(h.targetDays), h.targetPerDay, h.category, h.color, h.icon, h.streakDays, h.bestStreak, new Date().toISOString());

      // 90 days log generation
      for (let i = 0; i < 90; i++) {
        const d = format(subDays(today, i), 'yyyy-MM-dd');
        const prob = i < 15 ? 0.9 : i < 45 ? 0.75 : 0.6;
        if (Math.random() < prob) {
          const logId = `hl_${h.id}_${d}`;
          insertHabitLog.run(logId, h.id, d, 1, 1, new Date().toISOString());
          habitLogsForSupabase.push({
            id: logId,
            habit_id: h.id,
            date: d,
            count: 1,
            completed: true,
            created_at: new Date().toISOString()
          });
        }
      }
    });

    await supabase.from('habits').insert(habits.map(h => ({
      id: h.id,
      title: h.title,
      description: h.description,
      frequency: h.frequency,
      target_days: h.targetDays,
      target_per_day: h.targetPerDay,
      category: h.category,
      color: h.color,
      icon: h.icon,
      streak_days: h.streakDays,
      best_streak: h.bestStreak,
      created_at: new Date().toISOString()
    })));

    // Batch insert logs
    for (let i = 0; i < habitLogsForSupabase.length; i += 100) {
      await supabase.from('habit_logs').insert(habitLogsForSupabase.slice(i, i + 100));
    }

    // 7. Time Sessions
    const timeSessions = [
      {
        id: 'sess_1',
        taskId: 'task_1',
        durationMinutes: 25,
        mode: 'focus',
        notes: 'Redacción de diapositivas de arquitectura',
        startedAt: `${todayStr}T10:00:00.000Z`,
        endedAt: `${todayStr}T10:25:00.000Z`,
      },
      {
        id: 'sess_2',
        taskId: 'task_6',
        durationMinutes: 45,
        mode: 'focus',
        notes: 'Pruebas de latencia en Redis',
        startedAt: `${format(subDays(today, 1), 'yyyy-MM-dd')}T15:00:00.000Z`,
        endedAt: `${format(subDays(today, 1), 'yyyy-MM-dd')}T15:45:00.000Z`,
      },
    ];

    const insertSession = db.prepare(
      'INSERT INTO time_sessions (id, task_id, duration_minutes, mode, notes, started_at, ended_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    timeSessions.forEach((s) => {
      insertSession.run(s.id, s.taskId, s.durationMinutes, s.mode, s.notes, s.startedAt, s.endedAt, new Date().toISOString());
    });

    await supabase.from('time_sessions').insert(timeSessions.map(s => ({
      id: s.id,
      task_id: s.taskId,
      duration_minutes: s.durationMinutes,
      mode: s.mode,
      notes: s.notes,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      created_at: new Date().toISOString()
    })));

    // 8. Notes
    const sampleNotes = [
      {
        id: 'note_1',
        title: 'Checklist de Despliegue en Producción',
        content: `# Procedimiento de Despliegue

1. **Variables de Entorno**:
   - Verificar NEXT_PUBLIC_SUPABASE_URL
   - Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
2. **Base de Datos**:
   - Validar políticas de Row Level Security (RLS)
   - Confirmar índices en claves foráneas
3. **Validación de Rendimiento**:
   - Monitorear respuestas de endpoints REST
   - Comprobar soporte PWA y respuesta táctil mobile`,
        projectId: 'proj_trabajo',
        taskId: 'task_1',
        tags: ['deploy', 'infra', 'checklist'],
        isPinned: true,
      },
      {
        id: 'note_2',
        title: 'Ideas de Optimización para MrFocus',
        content: `# Ideas de Optimización

- Atajos de teclado fluidos con modal de ayuda
- Soporte para etiquetas jerárquicas
- Sincronización en tiempo real mediante WebSockets
- Exportación de métricas en formato CSV y PDF`,
        projectId: 'proj_trabajo',
        taskId: null,
        tags: ['ideas', 'roadmap'],
        isPinned: false,
      },
    ];

    const insertNote = db.prepare(
      'INSERT INTO notes (id, title, content, project_id, task_id, tags, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    sampleNotes.forEach((n) => {
      insertNote.run(n.id, n.title, n.content, n.projectId, n.taskId, JSON.stringify(n.tags), n.isPinned ? 1 : 0, new Date().toISOString(), new Date().toISOString());
    });

    await supabase.from('notes').insert(sampleNotes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      project_id: n.projectId,
      task_id: n.taskId,
      tags: n.tags,
      is_pinned: n.isPinned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })));

    return NextResponse.json({
      success: true,
      message: 'Base de datos de Supabase y local inicializadas con éxito. Datos minimalistas sin emojis y sin gamificación.',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Error al poblar la base de datos' }, { status: 500 });
  }
}
