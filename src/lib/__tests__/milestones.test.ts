import { describe, expect, it } from "vitest";
import { findNewlyUnlocked, nextMilestone, seedBuiltinMilestones } from "../milestones";

describe("milestones", () => {
  it("finds milestones crossed by the current streak that aren't unlocked yet", () => {
    const milestones = seedBuiltinMilestones();
    const unlocked = findNewlyUnlocked(milestones, 7);
    expect(unlocked.map((m) => m.id)).toEqual(["d3", "d7"]);
  });

  it("never re-flags a milestone that already has unlockedAt set", () => {
    const milestones = seedBuiltinMilestones().map((m) =>
      m.id === "d3" ? { ...m, unlockedAt: "2026-01-01T00:00:00.000Z" } : m,
    );
    const unlocked = findNewlyUnlocked(milestones, 60);
    expect(unlocked.some((m) => m.id === "d3")).toBe(false);
    expect(unlocked.map((m) => m.id)).toEqual(["d7", "d14", "d30", "d50"]);
  });

  it("does not re-flag a milestone once unlocked even if the streak later resets and climbs back through it", () => {
    let milestones = seedBuiltinMilestones();
    milestones = milestones.map((m) =>
      m.id === "d3" ? { ...m, unlockedAt: new Date().toISOString() } : m,
    );
    // Streak reset to 0 then climbed back to 3.
    const unlocked = findNewlyUnlocked(milestones, 3);
    expect(unlocked).toEqual([]);
  });

  it("nextMilestone returns the lowest-day-count locked milestone above the current streak", () => {
    const milestones = seedBuiltinMilestones();
    expect(nextMilestone(milestones, 10)?.id).toBe("d14");
  });
});
