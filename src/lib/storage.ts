import type { AppState } from "./types";
import { STATE_STORAGE_KEY } from "./types";
import { seedBuiltinMilestones } from "./milestones";

export function createInitialState(): AppState {
  return {
    checkIns: [],
    extraWorkouts: [],
    milestones: seedBuiltinMilestones(),
    deletedMilestoneIds: [],
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

    const deletedIds = new Set(parsed.deletedMilestoneIds ?? []);
    const existing = parsed.milestones ?? [];
    const existingIds = new Set(existing.map((m) => m.id));
    // Only fills in a builtin that's neither already present nor deliberately deleted — so the
    // ladder growing in a future release doesn't resurrect something the user removed.
    const missingBuiltins = seedBuiltinMilestones().filter(
      (m) => !existingIds.has(m.id) && !deletedIds.has(m.id),
    );

    return {
      ...createInitialState(),
      ...parsed,
      milestones: [...existing, ...missingBuiltins],
      deletedMilestoneIds: parsed.deletedMilestoneIds ?? [],
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
