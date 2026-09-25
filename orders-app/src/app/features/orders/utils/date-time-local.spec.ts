import { formatDateTimeLocal, parseDateTimeLocal } from './date-time-local';

describe('parseDateTimeLocal', () => {
  it('parses a datetime-local value as local time', () => {
    const timestamp = parseDateTimeLocal('2025-06-20T18:30');
    const date = new Date(timestamp);

    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(20);
    expect(date.getHours()).toBe(18);
    expect(date.getMinutes()).toBe(30);
  });
});

describe('formatDateTimeLocal', () => {
  it('formats a date as a zero-padded datetime-local value', () => {
    const date = new Date(2025, 0, 5, 9, 3);

    expect(formatDateTimeLocal(date)).toBe('2025-01-05T09:03');
  });

  it('round-trips with parseDateTimeLocal', () => {
    const original = new Date(2026, 11, 31, 23, 59);
    const value = formatDateTimeLocal(original);

    expect(parseDateTimeLocal(value)).toBe(original.getTime());
  });
});
