import { describe, it, expect } from 'vitest';
import { formatMinutes, getPriorityLabel, cn } from '../utils';

describe('Utility Functions', () => {
  it('should format minutes into clean human-readable text', () => {
    expect(formatMinutes(20)).toBe('20m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(150)).toBe('2h 30m');
  });

  it('should return correct priority labels and badge classes', () => {
    const p1 = getPriorityLabel(1);
    expect(p1.label).toBe('Urgente');

    const p2 = getPriorityLabel(2);
    expect(p2.label).toBe('Alta');

    const p3 = getPriorityLabel(3);
    expect(p3.label).toBe('Media');

    const p4 = getPriorityLabel(4);
    expect(p4.label).toBe('Normal');
  });

  it('should merge tailwind classes with cn helper', () => {
    const res = cn('px-2 py-1', 'bg-red-500', { 'text-white': true, 'text-black': false });
    expect(res).toContain('px-2');
    expect(res).toContain('bg-red-500');
    expect(res).toContain('text-white');
    expect(res).not.toContain('text-black');
  });
});
