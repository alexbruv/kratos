import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const DATE_FORMAT = "yyyy-MM-dd";

/** Local calendar date string for a given Date (defaults to now), e.g. "2026-08-28". */
export function toDateStr(date: Date = new Date()): string {
  return format(date, DATE_FORMAT);
}

/** Parses a "YYYY-MM-DD" string as a local-midnight Date. */
export function fromDateStr(dateStr: string): Date {
  return parseISO(dateStr);
}

export function todayStr(): string {
  return toDateStr();
}

/** Adds (or subtracts, with a negative count) whole days to a date string. */
export function addDaysStr(dateStr: string, amount: number): string {
  return toDateStr(addDays(fromDateStr(dateStr), amount));
}

/** ISO date strings compare correctly as plain strings (same fixed-width format). */
export function isBeforeDay(a: string, b: string): boolean {
  return a < b;
}

export function isAfterDay(a: string, b: string): boolean {
  return a > b;
}

export function daysBetween(fromDateStrVal: string, toDateStrVal: string): number {
  return differenceInCalendarDays(fromDateStr(toDateStrVal), fromDateStr(fromDateStrVal));
}

/** ISO week id, Monday-start, e.g. "2026-W35". Matches the fixed calendar-week boundary the spec requires. */
export function weekIdForDate(dateStr: string): string {
  const date = fromDateStr(dateStr);
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** The Monday..Sunday date strings (7 entries) of the calendar week containing dateStr. */
export function weekDates(dateStr: string): string[] {
  const monday = startOfWeek(fromDateStr(dateStr), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)));
}

export function mondayOfWeek(dateStr: string): string {
  return toDateStr(startOfWeek(fromDateStr(dateStr), { weekStartsOn: 1 }));
}

export function sundayOfWeek(dateStr: string): string {
  return toDateStr(endOfWeek(fromDateStr(dateStr), { weekStartsOn: 1 }));
}

/** All date strings (1st..last) in the calendar month containing dateStr. */
export function monthDates(dateStr: string): string[] {
  const date = fromDateStr(dateStr);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map((d) => toDateStr(d));
}

export function monthLabel(dateStr: string): string {
  return format(fromDateStr(dateStr), "MMMM yyyy");
}

export function monthKey(dateStr: string): string {
  return format(fromDateStr(dateStr), "yyyy-MM");
}

/** 0 = Monday .. 6 = Sunday, for laying out a Mon-start calendar grid. */
export function mondayIndexOfWeek(dateStr: string): number {
  return (getDay(fromDateStr(dateStr)) + 6) % 7;
}

/** The `count` calendar months ending with (and including) the month containing dateStr, oldest first. */
export function lastNMonths(dateStr: string, count: number): string[] {
  const date = fromDateStr(dateStr);
  return Array.from({ length: count }, (_, i) =>
    toDateStr(addMonths(date, i - (count - 1))),
  );
}

/** Whole calendar months between two dates (e.g. same month = 0, one month apart = 1). */
export function monthsBetween(fromDateStrVal: string, toDateStrVal: string): number {
  return differenceInCalendarMonths(fromDateStr(toDateStrVal), fromDateStr(fromDateStrVal));
}
