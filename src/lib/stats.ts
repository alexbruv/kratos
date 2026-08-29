import { monthDates, monthLabel } from "./dates";
import { isProtectedDay } from "./streak";

export interface MonthlyRecap {
  monthLabel: string;
  daysTrained: number;
  daysElapsed: number;
  longestStreakInMonth: number;
}

/**
 * Recap for the calendar month containing referenceDate — "days elapsed" is
 * capped at today so an in-progress month reads as partial, not as if every
 * remaining day were already missed.
 */
export function monthlyRecap(
  referenceDate: string,
  checkInDates: ReadonlySet<string>,
  freezeUsedDates: ReadonlySet<string>,
  today: string,
): MonthlyRecap {
  const allDays = monthDates(referenceDate);
  const elapsedDays = allDays.filter((d) => d <= today);
  const daysTrained = elapsedDays.filter((d) => checkInDates.has(d)).length;

  let longest = 0;
  let running = 0;
  for (const d of allDays) {
    if (d > today) break;
    if (isProtectedDay(d, checkInDates, freezeUsedDates)) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  return {
    monthLabel: monthLabel(referenceDate),
    daysTrained,
    daysElapsed: elapsedDays.length,
    longestStreakInMonth: longest,
  };
}

