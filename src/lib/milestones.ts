import type { Milestone, MilestoneMetric } from "./types";

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

export function milestoneMetric(m: Pick<Milestone, "metric">): MilestoneMetric {
  return m.metric ?? "streak";
}

export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => a.days - b.days);
}

export function milestonesForMetric(milestones: Milestone[], metric: MilestoneMetric): Milestone[] {
  return sortMilestones(milestones.filter((m) => milestoneMetric(m) === metric));
}

export function nextMilestone(
  milestones: Milestone[],
  currentValue: number,
  metric: MilestoneMetric = "streak",
): Milestone | undefined {
  return milestonesForMetric(milestones, metric).find((m) => !m.unlockedAt && m.days > currentValue);
}

/** Milestones crossed by their metric's current value that aren't unlocked yet, ascending by threshold. */
export function findNewlyUnlocked(
  milestones: Milestone[],
  currentStreakDays: number,
  totalExtraWorkouts: number,
): Milestone[] {
  return sortMilestones(milestones).filter((m) => {
    if (m.unlockedAt) return false;
    const currentValue = milestoneMetric(m) === "extraWorkouts" ? totalExtraWorkouts : currentStreakDays;
    return m.days <= currentValue;
  });
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
