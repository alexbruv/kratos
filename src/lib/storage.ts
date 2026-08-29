import type { AppState } from "./types";
import { STATE_STORAGE_KEY } from "./types";
import { seedBuiltinMilestones } from "./milestones";

export function createInitialState(): AppState {
  return {
    checkIns: [],
    milestones: seedBuiltinMilestones(),
    freezeBank: 0,
    freezeUsedDates: [],
    lastEvaluatedWeek: undefined,
    theme: "light",
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...createInitialState(),
      ...parsed,
      // Never trust a stored ladder missing new built-ins if the config array grows later.
      milestones: parsed.milestones?.length ? parsed.milestones : seedBuiltinMilestones(),
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) — app still works for the session.
  }
}
