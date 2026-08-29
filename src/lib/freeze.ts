import { addDaysStr, weekIdForDate, mondayOfWeek, sundayOfWeek } from "./dates";
import { FREEZE_BANK_CAP } from "./types";

export interface FreezeState {
  freezeBank: number;
  freezeUsedDates: string[];
  lastEvaluatedWeek?: string;
}

/**
 * Fully deterministic given (checkIn history, today): walks every day from the
 * first check-in's week through today, applying freezes to missed past days
 * (earliest first, never today) and awarding a freeze on each completed
 * perfect week (7/7 real check-ins, no freeze spent that week) — including the
 * current week the moment its Sunday is checked in, without waiting for the
 * calendar boundary to actually pass. Recomputing from scratch on every load
 * — rather than mutating persisted counters incrementally — is what makes a
 * perfect week impossible to double-count across reloads.
 */
export function reconcileFreezeState(
  checkInDates: ReadonlySet<string>,
  today: string,
  cap: number = FREEZE_BANK_CAP,
): FreezeState {
  if (checkInDates.size === 0) {
    return { freezeBank: 0, freezeUsedDates: [], lastEvaluatedWeek: undefined };
  }

  let earliest = today;
  for (const d of checkInDates) {
    if (d < earliest) earliest = d;
  }

  let bank = 0;
  const usedDates: string[] = [];
  let lastEvaluatedWeek: string | undefined;
  let weekUsedFreeze = false;
  let weekAllCheckedIn = true;

  let d = mondayOfWeek(earliest);
  while (d <= today) {
    if (checkInDates.has(d)) {
      // real check-in, contributes to the perfect-week tally
    } else {
      weekAllCheckedIn = false;
      if (d !== today && bank > 0) {
        bank--;
        usedDates.push(d);
        weekUsedFreeze = true;
      }
    }

    if (d === sundayOfWeek(d)) {
      lastEvaluatedWeek = weekIdForDate(d);
      if (weekAllCheckedIn && !weekUsedFreeze) {
        bank = Math.min(cap, bank + 1);
      }
      weekUsedFreeze = false;
      weekAllCheckedIn = true;
    }

    d = addDaysStr(d, 1);
  }

  return { freezeBank: bank, freezeUsedDates: usedDates, lastEvaluatedWeek };
}
