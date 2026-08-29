export interface CheckIn {
  date: string; // "YYYY-MM-DD", local calendar date, one entry max per date
}

/** A workout beyond the day's one streak-counting check-in — doesn't affect the streak. */
export interface ExtraWorkout {
  id: string; // unique per entry — unlike CheckIn, several can share the same date
  date: string; // "YYYY-MM-DD", local calendar date
}

export type MilestoneSource = "builtin" | "custom";

/** What a milestone's `days` threshold is measured against. Defaults to "streak" when absent,
 * so existing data/built-ins (predating "extraWorkouts") keep behaving exactly as before. */
export type MilestoneMetric = "streak" | "extraWorkouts";

export interface Milestone {
  id: string; // "d7", "d100", or a generated id for custom ones
  days: number; // threshold — streak length, or extra-workout count, depending on `metric`
  label: string; // "WEEK ONE", "CENTURY", or the user's own title
  note?: string; // optional detail, mainly used by custom rewards
  source: MilestoneSource;
  metric?: MilestoneMetric; // undefined == "streak"
  badgeIcon?: string; // ref to a preset icon; omitted for custom (use placeholder style)
  unlockedAt?: string; // ISO timestamp, set once achieved — never re-triggers
  updatedAt?: string; // ISO timestamp of the last edit — lets multi-device sync pick the newer edit
}

export interface AppState {
  checkIns: CheckIn[]; // append-only log of completed days
  extraWorkouts: ExtraWorkout[]; // bonus workouts logged beyond the day's check-in
  milestones: Milestone[]; // built-in (seeded once) + custom, merged
  deletedMilestoneIds: string[]; // tombstones — deletion is permanent and wins over any sync
  freezeBank: number; // available freeze days, capped (default max 4)
  freezeUsedDates: string[]; // dates where a freeze was auto-applied instead of a real check-in
  lastEvaluatedWeek?: string; // ISO week id, prevents double-awarding a perfect week
  theme?: "light" | "dark";
}

export const FREEZE_BANK_CAP = 4;

export const STATE_STORAGE_KEY = "kratos:v1";
