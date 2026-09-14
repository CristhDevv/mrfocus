import { addDays, format, nextDay, setHours, setMinutes, parseISO } from 'date-fns';
import { ParsedNLPTask, Priority, Project } from '@/types';

const SPANISH_WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

const ENGLISH_WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function parseNaturalLanguageTask(
  input: string,
  availableProjects: Project[] = []
): ParsedNLPTask {
  let text = input.trim();
  const tags: string[] = [];
  let priority: Priority | undefined = undefined;
  let estimatedMinutes: number | undefined = undefined;
  let projectId: string | undefined = undefined;
  let projectName: string | undefined = undefined;
  let dueDate: string | undefined = undefined;
  let dueTime: string | undefined = undefined;
  let recurrenceRule: string | undefined = undefined;

  const now = new Date();

  // 1. Parse Duration (e.g. ~30m, ~1h, ~45min, ~1.5h, ~90m)
  const durationMatch = text.match(/~(\d+(?:\.\d+)?)\s*(horas?|minutos?|mins?|hrs?|h|m)\b/i);
  if (durationMatch) {
    const val = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      estimatedMinutes = Math.round(val * 60);
    } else {
      estimatedMinutes = Math.round(val);
    }
    text = text.replace(durationMatch[0], ' ');
  }

  // 2. Parse Priority (e.g. !p1, p1, !urgente, !alta, !p2, p2, !media, !p3, p3, !baja, !p4, p4)
  const p1Match = text.match(/(^|\s)(!p1|p1|!urgente|!alta)(?=\s|$)/i);
  if (p1Match) {
    priority = 1;
    text = text.replace(p1Match[0], ' ');
  } else {
    const p2Match = text.match(/(^|\s)(!p2|p2|!media|!importante)(?=\s|$)/i);
    if (p2Match) {
      priority = 2;
      text = text.replace(p2Match[0], ' ');
    } else {
      const p3Match = text.match(/(^|\s)(!p3|p3|!baja)(?=\s|$)/i);
      if (p3Match) {
        priority = 3;
        text = text.replace(p3Match[0], ' ');
      } else {
        const p4Match = text.match(/(^|\s)(!p4|p4)(?=\s|$)/i);
        if (p4Match) {
          priority = 4;
          text = text.replace(p4Match[0], ' ');
        }
      }
    }
  }

  // 3. Parse Tags (#tag)
  const tagMatches = text.match(/#([\w\-áéíóúÁÉÍÓÚñÑ]+)/g);
  if (tagMatches) {
    tagMatches.forEach((t) => {
      const cleanTag = t.substring(1);
      if (!tags.includes(cleanTag)) {
        tags.push(cleanTag);
      }
      text = text.replace(t, ' ');
    });
  }

  // 4. Parse Project (@project)
  const projectMatch = text.match(/@([\w\-áéíóúÁÉÍÓÚñÑ]+)/);
  if (projectMatch) {
    const pQuery = projectMatch[1].toLowerCase();
    const matchedProject = availableProjects.find(
      (p) => p.name.toLowerCase() === pQuery || p.id.toLowerCase() === pQuery
    );
    if (matchedProject) {
      projectId = matchedProject.id;
      projectName = matchedProject.name;
    } else {
      projectName = projectMatch[1];
    }
    text = text.replace(projectMatch[0], ' ');
  }

  // 5. Parse Recurrence (check specific weekdays first before generic weekly/monthly)
  const monthlyDayMatch = text.match(/(cada|todos\s+los)\s+d[ií]as?\s+(\d{1,2})|(el\s+)?d[ií]a\s+(\d{1,2})\s+de\s+cada\s+mes/i);
  const recWeekdayMatch = text.match(/(todos los|cada)\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

  if (monthlyDayMatch) {
    const dayNum = monthlyDayMatch[2] || monthlyDayMatch[4];
    recurrenceRule = `monthly:${dayNum}`;
    text = text.replace(monthlyDayMatch[0], ' ');
  } else if (recWeekdayMatch) {
    const dayWord = recWeekdayMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    recurrenceRule = `weekly:${dayWord}`;
    text = text.replace(recWeekdayMatch[0], ' ');
  } else if (/\b(todos los d[ií]as|cada d[ií]a|diario|diariamente|every day|daily)\b/i.test(text)) {
    recurrenceRule = 'daily';
    text = text.replace(/\b(todos los d[ií]as|cada d[ií]a|diario|diariamente|every day|daily)\b/i, ' ');
  } else if (/\b(de lunes a viernes|entre semana|d[ií]as laborables|weekdays)\b/i.test(text)) {
    recurrenceRule = 'weekdays';
    text = text.replace(/\b(de lunes a viernes|entre semana|d[ií]as laborables|weekdays)\b/i, ' ');
  } else if (/\b(cada semana|semanalmente|every week|weekly)\b/i.test(text)) {
    recurrenceRule = 'weekly';
    text = text.replace(/\b(cada semana|semanalmente|every week|weekly)\b/i, ' ');
  } else if (/\b(cada mes|mensualmente|every month|monthly)\b/i.test(text)) {
    recurrenceRule = 'monthly';
    text = text.replace(/\b(cada mes|mensualmente|every month|monthly)\b/i, ' ');
  }

  // 6. Parse Time (e.g. "a las 15:30", "a las 4pm", "a las 9am", "18:00", "8:30pm", "at 3:00pm", "at 4pm")
  const timeMatch = text.match(/(?:a\s+las?|at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i) ||
                    text.match(/(?:a\s+las?\s+)(\d{1,2})(?::(\d{2}))?/i) ||
                    text.match(/\b(\d{1,2}):(\d{2})\b/);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3]?.toLowerCase().replace(/\./g, '');

    if (meridian === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridian === 'am' && hours === 12) {
      hours = 0;
    }

    dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    text = text.replace(timeMatch[0], ' ');
  }

  // 7. Parse Date (relative & absolute)
  if (/\b(hoy|today)\b/i.test(text)) {
    dueDate = format(now, 'yyyy-MM-dd');
    text = text.replace(/\b(hoy|today)\b/i, ' ');
  } else if (/\b(pasado mañana|day after tomorrow)\b/i.test(text)) {
    dueDate = format(addDays(now, 2), 'yyyy-MM-dd');
    text = text.replace(/\b(pasado mañana|day after tomorrow)\b/i, ' ');
  } else if (/\b(mañana|tomorrow)\b/i.test(text)) {
    dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
    text = text.replace(/\b(mañana|tomorrow)\b/i, ' ');
  } else {
    // "el [dia de la semana]" / "este [dia de la semana]" / "proximo [dia de la semana]"
    const weekdayMatch = text.match(/(?:el|este|pr[oó]ximo|next)?\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (weekdayMatch) {
      const rawDay = weekdayMatch[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dayIndex = SPANISH_WEEKDAYS[rawDay] !== undefined ? SPANISH_WEEKDAYS[rawDay] : ENGLISH_WEEKDAYS[rawDay];

      if (dayIndex !== undefined) {
        const currentDayIndex = now.getDay();
        let daysToAdd = (dayIndex - currentDayIndex + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        const targetDate = addDays(now, daysToAdd);
        dueDate = format(targetDate, 'yyyy-MM-dd');
        text = text.replace(weekdayMatch[0], ' ');
      }
    } else {
      // Absolute dates (e.g. "15 de octubre", "25 sep", "2026-10-15")
      const isoDateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (isoDateMatch) {
        dueDate = isoDateMatch[1];
        text = text.replace(isoDateMatch[0], ' ');
      } else {
        const namedDateMatch = text.match(/(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
        if (namedDateMatch) {
          const monthsMap: Record<string, number> = {
            enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
            julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
          };
          const d = parseInt(namedDateMatch[1], 10);
          const m = monthsMap[namedDateMatch[2].toLowerCase()];
          if (m !== undefined) {
            const yr = now.getFullYear();
            const calcDate = new Date(yr, m, d);
            dueDate = format(calcDate, 'yyyy-MM-dd');
            text = text.replace(namedDateMatch[0], ' ');
          }
        }
      }
    }
  }

  // 8. Clean up extra spaces, trailing prepositions, and return
  const cleanTitle = text
    .replace(/\s+/g, ' ')
    .replace(/\b(para|el|la|en|a las?|at|on|for)\s*$/i, '')
    .trim();

  return {
    title: cleanTitle || input.trim(),
    dueDate,
    dueTime,
    recurrenceRule,
    priority: priority || 4,
    estimatedMinutes,
    projectId,
    projectName,
    tags,
  };
}
