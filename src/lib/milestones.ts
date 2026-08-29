import type { Milestone } from "./types";

/** Editable config array, not hardcoded logic — retune the ladder here. */
export const BUILTIN_MILESTONES: readonly Omit<Milestone, "unlockedAt">[] = [
  { id: "d3", days: 3, label: "FIRST SPARK", source: "builtin", badgeIcon: "spark" },
  { id: "d7", days: 7, label: "WEEK ONE", source: "builtin", badgeIcon: "flag" },
  { id: "d14", days: 14, label: "TWO WEEKS IN", source: "builtin", badgeIcon: "star" },
  { id: "d30", days: 30, label: "ONE MONTH", source: "builtin", badgeIcon: "triangle" },
  { id: "d50", days: 50, label: "HALF CENTURY", source: "builtin", badgeIcon: "diamond" },
  { id: "d100", days: 100, label: "CENTURY CLUB", source: "builtin", badgeIcon: "sun" },
  { id: "d200", days: 200, label: "DOUBLE CENTURY", source: "builtin", badgeIcon: "bolt" },
  { id: "d365", days: 365, label: "ONE YEAR", source: "builtin", badgeIcon: "crown" },
];

export function seedBuiltinMilestones(): Milestone[] {
  return BUILTIN_MILESTONES.map((m) => ({ ...m }));
}

export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => a.days - b.days);
}

export function nextMilestone(
  milestones: Milestone[],
  currentStreakDays: number,
): Milestone | undefined {
  return sortMilestones(milestones).find((m) => !m.unlockedAt && m.days > currentStreakDays);
}

/** Milestones crossed by currentStreakDays that aren't marked unlocked yet, ascending by day count. */
export function findNewlyUnlocked(
  milestones: Milestone[],
  currentStreakDays: number,
): Milestone[] {
  return sortMilestones(milestones).filter(
    (m) => !m.unlockedAt && m.days <= currentStreakDays,
  );
}

export function generateCustomMilestoneId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
