import { describe, expect, it } from "vitest";
import { findNewlyUnlocked, nextMilestone, seedBuiltinMilestones } from "../milestones";
import type { Milestone } from "../types";

describe("milestones", () => {
  it("finds milestones crossed by the current streak that aren't unlocked yet", () => {
    const milestones = seedBuiltinMilestones();
    const unlocked = findNewlyUnlocked(milestones, 7, 0);
    expect(unlocked.map((m) => m.id)).toEqual(["d3", "d7"]);
  });

  it("never re-flags a milestone that already has unlockedAt set", () => {
    const milestones = seedBuiltinMilestones().map((m) =>
      m.id === "d3" ? { ...m, unlockedAt: "2026-01-01T00:00:00.000Z" } : m,
    );
    const unlocked = findNewlyUnlocked(milestones, 60, 0);
    expect(unlocked.some((m) => m.id === "d3")).toBe(false);
    expect(unlocked.map((m) => m.id)).toEqual(["d7", "d14", "d30", "d50"]);
  });

  it("does not re-flag a milestone once unlocked even if the streak later resets and climbs back through it", () => {
    let milestones = seedBuiltinMilestones();
    milestones = milestones.map((m) =>
      m.id === "d3" ? { ...m, unlockedAt: new Date().toISOString() } : m,
    );
    // Streak reset to 0 then climbed back to 3.
    const unlocked = findNewlyUnlocked(milestones, 3, 0);
    expect(unlocked).toEqual([]);
  });

  it("nextMilestone returns the lowest-day-count locked milestone above the current streak", () => {
    const milestones = seedBuiltinMilestones();
    expect(nextMilestone(milestones, 10)?.id).toBe("d14");
  });

  describe("extra-workout bonus rewards", () => {
    const bonus: Milestone = {
      id: "custom-bonus-1",
      days: 10,
      label: "Extra effort",
      source: "custom",
      metric: "extraWorkouts",
    };
    const streakOne: Milestone = {
      id: "custom-streak-1",
      days: 10,
      label: "Ten days",
      source: "custom",
      metric: "streak",
    };

    it("checks a bonus reward against total extra workouts, not the streak", () => {
      // Streak is way above 10, but zero extra workouts logged — shouldn't unlock the bonus.
      expect(findNewlyUnlocked([bonus], 50, 0)).toEqual([]);
      expect(findNewlyUnlocked([bonus], 0, 10).map((m) => m.id)).toEqual(["custom-bonus-1"]);
    });

    it("does not let extra workouts unlock a streak reward or vice versa", () => {
      expect(findNewlyUnlocked([streakOne], 0, 50)).toEqual([]);
      expect(findNewlyUnlocked([bonus], 50, 0)).toEqual([]);
    });

    it("nextMilestone filters by metric so streak and bonus progress don't interleave", () => {
      const milestones = [bonus, streakOne];
      expect(nextMilestone(milestones, 5, "streak")?.id).toBe("custom-streak-1");
      expect(nextMilestone(milestones, 5, "extraWorkouts")?.id).toBe("custom-bonus-1");
    });

    it("treats a milestone with no metric field as a streak milestone (backward compatible)", () => {
      const legacy: Milestone = { id: "d7", days: 7, label: "WEEK ONE", source: "builtin" };
      expect(findNewlyUnlocked([legacy], 7, 0).map((m) => m.id)).toEqual(["d7"]);
      expect(findNewlyUnlocked([legacy], 0, 7)).toEqual([]);
    });
  });
});
