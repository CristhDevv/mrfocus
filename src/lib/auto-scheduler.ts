import { Task, CalendarEvent } from '@/types';
import { parseISO, format, addMinutes, isBefore, isAfter, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

export interface ScheduleOptions {
  workStartHour?: number; // default 9 (09:00)
  workEndHour?: number;   // default 18 (18:00)
  lunchStartHour?: number; // default 13 (13:00)
  lunchDurationMinutes?: number; // default 60
  bufferMinutes?: number; // default 5 min between tasks
  dayDate?: string; // 'YYYY-MM-DD'
}

export interface ScheduleResult {
  scheduledTasks: Task[];
  unplacedTasks: Task[];
  totalWorkMinutes: number;
  scheduledMinutes: number;
  freeMinutes: number;
  isOverloaded: boolean;
}

interface TimeWindow {
  start: Date;
  end: Date;
}

export function autoScheduleTasks(
  tasksToSchedule: Task[],
  existingEvents: CalendarEvent[],
  existingScheduledTasks: Task[],
  options: ScheduleOptions = {}
): ScheduleResult {
  const {
    workStartHour = 9,
    workEndHour = 18,
    lunchStartHour = 13,
    lunchDurationMinutes = 60,
    bufferMinutes = 5,
    dayDate = format(new Date(), 'yyyy-MM-dd'),
  } = options;

  const baseDate = parseISO(`${dayDate}T00:00:00`);
  const workStart = setMinutes(setHours(baseDate, workStartHour), 0);
  const workEnd = setMinutes(setHours(baseDate, workEndHour), 0);
  const totalWorkMinutes = (workEndHour - workStartHour) * 60 - lunchDurationMinutes;

  // 1. Build busy intervals
  const busyWindows: TimeWindow[] = [];

  // Lunch break
  if (lunchDurationMinutes > 0) {
    const lunchStart = setMinutes(setHours(baseDate, lunchStartHour), 0);
    const lunchEnd = addMinutes(lunchStart, lunchDurationMinutes);
    busyWindows.push({ start: lunchStart, end: lunchEnd });
  }

  // Calendar events for the day
  for (const event of existingEvents) {
    const evStart = parseISO(event.startTime);
    const evEnd = parseISO(event.endTime);
    if (!event.isAllDay && isBefore(evStart, workEnd) && isAfter(evEnd, workStart)) {
      busyWindows.push({
        start: isBefore(evStart, workStart) ? workStart : evStart,
        end: isAfter(evEnd, workEnd) ? workEnd : evEnd,
      });
    }
  }

  // Existing already-scheduled tasks (excluding ones we are currently rescheduling)
  const taskIdsToSchedule = new Set(tasksToSchedule.map((t) => t.id));
  for (const st of existingScheduledTasks) {
    if (!taskIdsToSchedule.has(st.id) && st.scheduledStart && st.scheduledEnd) {
      const stStart = parseISO(st.scheduledStart);
      const stEnd = parseISO(st.scheduledEnd);
      if (isBefore(stStart, workEnd) && isAfter(stEnd, workStart)) {
        busyWindows.push({
          start: isBefore(stStart, workStart) ? workStart : stStart,
          end: isAfter(stEnd, workEnd) ? workEnd : stEnd,
        });
      }
    }
  }

  // Sort and merge overlapping busy intervals
  busyWindows.sort((a, b) => a.start.getTime() - b.start.getTime());
  const mergedBusy: TimeWindow[] = [];
  for (const w of busyWindows) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...w });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (w.start.getTime() <= last.end.getTime()) {
        if (w.end.getTime() > last.end.getTime()) {
          last.end = w.end;
        }
      } else {
        mergedBusy.push({ ...w });
      }
    }
  }

  // Compute free slots within [workStart, workEnd]
  const freeSlots: TimeWindow[] = [];
  let pointer = new Date(workStart);

  for (const busy of mergedBusy) {
    if (busy.start > pointer) {
      freeSlots.push({ start: new Date(pointer), end: new Date(busy.start) });
    }
    if (busy.end > pointer) {
      pointer = new Date(busy.end);
    }
  }

  if (pointer < workEnd) {
    freeSlots.push({ start: new Date(pointer), end: new Date(workEnd) });
  }

  // 2. Sort candidate tasks: P1 > P2 > P3 > P4, then by due date, then duration
  const sortedTasks = [...tasksToSchedule].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // 1 (Urgent) comes before 4 (Low)
    }
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return (b.estimatedMinutes || 30) - (a.estimatedMinutes || 30);
  });

  // 3. Fit tasks into free slots
  const scheduledTasks: Task[] = [];
  const unplacedTasks: Task[] = [];
  let totalScheduledMinutes = 0;

  for (const task of sortedTasks) {
    const duration = task.estimatedMinutes || 30;
    let placed = false;

    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);

      if (slotDuration >= duration) {
        const taskStart = new Date(slot.start);
        const taskEnd = addMinutes(taskStart, duration);

        scheduledTasks.push({
          ...task,
          scheduledStart: taskStart.toISOString(),
          scheduledEnd: taskEnd.toISOString(),
        });

        totalScheduledMinutes += duration;

        // Update slot start + buffer
        const nextStart = addMinutes(taskEnd, bufferMinutes);
        if (nextStart < slot.end) {
          slot.start = nextStart;
        } else {
          // Remove filled slot
          freeSlots.splice(i, 1);
        }

        placed = true;
        break;
      }
    }

    if (!placed) {
      unplacedTasks.push(task);
    }
  }

  return {
    scheduledTasks,
    unplacedTasks,
    totalWorkMinutes,
    scheduledMinutes: totalScheduledMinutes,
    freeMinutes: Math.max(0, totalWorkMinutes - totalScheduledMinutes),
    isOverloaded: unplacedTasks.length > 0 || totalScheduledMinutes > totalWorkMinutes,
  };
}
