export interface CheckIn {
  date: string; // "YYYY-MM-DD", local calendar date, one entry max per date
}

export type MilestoneSource = "builtin" | "custom";

export interface Milestone {
  id: string; // "d7", "d100", or a generated id for custom ones
  days: number; // streak length required
  label: string; // "WEEK ONE", "CENTURY", or the user's own title
  note?: string; // optional detail, mainly used by custom rewards
  source: MilestoneSource;
  badgeIcon?: string; // ref to a preset icon; omitted for custom (use placeholder style)
  unlockedAt?: string; // ISO timestamp, set once achieved — never re-triggers
}

export interface AppState {
  checkIns: CheckIn[]; // append-only log of completed days
  milestones: Milestone[]; // built-in (seeded once) + custom, merged
  freezeBank: number; // available freeze days, capped (default max 4)
  freezeUsedDates: string[]; // dates where a freeze was auto-applied instead of a real check-in
  lastEvaluatedWeek?: string; // ISO week id, prevents double-awarding a perfect week
  theme?: "light" | "dark";
}

export const FREEZE_BANK_CAP = 4;

export const STATE_STORAGE_KEY = "kratos:v1";
