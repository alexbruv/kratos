import { addDaysStr, isBeforeDay } from "./dates";

export type DayState = "done" | "frozen" | "missed" | "empty";

export function isProtectedDay(
  date: string,
  checkInDates: ReadonlySet<string>,
  freezeUsedDates: ReadonlySet<string>,
): boolean {
  return checkInDates.has(date) || freezeUsedDates.has(date);
}

/**
 * A day's visual/state classification for the history grid.
 * "empty" covers both future days and today-before-it's-marked, since today
 * only resolves to done/missed once the day has actually passed.
 */
export function getDayState(
  date: string,
  checkInDates: ReadonlySet<string>,
  freezeUsedDates: ReadonlySet<string>,
  today: string,
): DayState {
  if (date >= today) {
    return checkInDates.has(date) ? "done" : "empty";
  }
  if (checkInDates.has(date)) return "done";
  if (freezeUsedDates.has(date)) return "frozen";
  return "missed";
}

/**
 * Consecutive protected days ending today or yesterday. Today pending (not
 * yet checked in) doesn't zero the streak until the day actually passes.
 */
export function currentStreak(
  checkInDates: ReadonlySet<string>,
  freezeUsedDates: ReadonlySet<string>,
  today: string,
): number {
  const yesterday = addDaysStr(today, -1);
  let cursor = isProtectedDay(today, checkInDates, freezeUsedDates) ? today : yesterday;
  let count = 0;
  while (isProtectedDay(cursor, checkInDates, freezeUsedDates)) {
    count++;
    cursor = addDaysStr(cursor, -1);
  }
  return count;
}

/** Longest run of consecutive protected days anywhere in history, up to and including today. */
export function longestStreak(
  checkInDates: ReadonlySet<string>,
  freezeUsedDates: ReadonlySet<string>,
  today: string,
): number {
  const allDates = [...checkInDates, ...freezeUsedDates];
  if (allDates.length === 0) return 0;

  let earliest = allDates[0];
  for (const d of allDates) {
    if (isBeforeDay(d, earliest)) earliest = d;
  }

  let longest = 0;
  let running = 0;
  let cursor = earliest;
  while (cursor <= today) {
    if (isProtectedDay(cursor, checkInDates, freezeUsedDates)) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
    cursor = addDaysStr(cursor, 1);
  }
  return longest;
}

export function totalDaysLogged(checkInDates: ReadonlySet<string>): number {
  return checkInDates.size;
}
