import { describe, expect, it } from "vitest";
import { mergeStates, statesEqual } from "../sync";
import type { AppState } from "../types";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    checkIns: [],
    milestones: [],
    deletedMilestoneIds: [],
    freezeBank: 0,
    freezeUsedDates: [],
    theme: "light",
    ...overrides,
  };
}

describe("mergeStates", () => {
  it("unions check-ins from two devices without duplicating overlapping dates", () => {
    const local = state({ checkIns: [{ date: "2026-08-01" }, { date: "2026-08-02" }] });
    const remote = state({ checkIns: [{ date: "2026-08-02" }, { date: "2026-08-03" }] });
    const merged = mergeStates(local, remote);
    expect(merged.checkIns.map((c) => c.date)).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
  });

  it("includes a custom milestone that only exists on the remote device", () => {
    const local = state({ milestones: [] });
    const remote = state({
      milestones: [{ id: "custom-1", days: 730, label: "Bali trip", source: "custom" }],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.map((m) => m.id)).toEqual(["custom-1"]);
  });

  it("OR's unlocked status when only one side has unlocked a milestone", () => {
    const local = state({
      milestones: [{ id: "d7", days: 7, label: "WEEK ONE", source: "builtin" }],
    });
    const remote = state({
      milestones: [
        { id: "d7", days: 7, label: "WEEK ONE", source: "builtin", unlockedAt: "2026-08-01T00:00:00.000Z" },
      ],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.find((m) => m.id === "d7")?.unlockedAt).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });

  it("keeps the earlier unlock timestamp when both sides unlocked the same milestone", () => {
    const local = state({
      milestones: [
        { id: "d7", days: 7, label: "WEEK ONE", source: "builtin", unlockedAt: "2026-08-05T00:00:00.000Z" },
      ],
    });
    const remote = state({
      milestones: [
        { id: "d7", days: 7, label: "WEEK ONE", source: "builtin", unlockedAt: "2026-08-01T00:00:00.000Z" },
      ],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.find((m) => m.id === "d7")?.unlockedAt).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });

  it("prefers local's descriptive fields as a tiebreak when neither side has an edit timestamp", () => {
    const local = state({
      milestones: [{ id: "custom-1", days: 730, label: "Bali trip (edited)", source: "custom" }],
    });
    const remote = state({
      milestones: [{ id: "custom-1", days: 730, label: "Bali trip", source: "custom" }],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.find((m) => m.id === "custom-1")?.label).toBe("Bali trip (edited)");
  });

  it("prefers remote's edit over local's untouched seed default — the bug a brand-new device would hit otherwise", () => {
    // local is a freshly-seeded builtin ladder (no updatedAt); remote has a real edit from
    // another device. Without timestamp-aware merging, local's stale default would win here.
    const local = state({
      milestones: [{ id: "d3", days: 3, label: "FIRST SPARK", source: "builtin" }],
    });
    const remote = state({
      milestones: [
        {
          id: "d3",
          days: 3,
          label: "FIRST SPARK (edited)",
          source: "builtin",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.find((m) => m.id === "d3")?.label).toBe("FIRST SPARK (edited)");
  });

  it("prefers the more recently edited side when both have edited the same milestone", () => {
    const local = state({
      milestones: [
        {
          id: "d3",
          days: 3,
          label: "local edit",
          source: "builtin",
          updatedAt: "2026-08-05T00:00:00.000Z",
        },
      ],
    });
    const remote = state({
      milestones: [
        {
          id: "d3",
          days: 3,
          label: "remote edit",
          source: "builtin",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    });
    expect(mergeStates(local, remote).milestones.find((m) => m.id === "d3")?.label).toBe(
      "local edit",
    );
    expect(mergeStates(remote, local).milestones.find((m) => m.id === "d3")?.label).toBe(
      "local edit",
    );
  });

  it("keeps a milestone deleted on one side out of the merge, even if the other side still has it", () => {
    const local = state({
      milestones: [{ id: "d3", days: 3, label: "FIRST SPARK", source: "builtin" }],
      deletedMilestoneIds: [],
    });
    const remote = state({
      milestones: [],
      deletedMilestoneIds: ["d3"],
    });
    const merged = mergeStates(local, remote);
    expect(merged.milestones.some((m) => m.id === "d3")).toBe(false);
    expect(merged.deletedMilestoneIds).toEqual(["d3"]);
  });

  it("unions tombstones from both sides", () => {
    const local = state({ deletedMilestoneIds: ["d3"] });
    const remote = state({ deletedMilestoneIds: ["d7"] });
    const merged = mergeStates(local, remote);
    expect(new Set(merged.deletedMilestoneIds)).toEqual(new Set(["d3", "d7"]));
  });

  it("keeps local's theme regardless of remote", () => {
    const local = state({ theme: "dark" });
    const remote = state({ theme: "light" });
    expect(mergeStates(local, remote).theme).toBe("dark");
  });
});

describe("statesEqual", () => {
  it("is true for equivalent states with check-ins in a different order", () => {
    const a = state({ checkIns: [{ date: "2026-08-01" }, { date: "2026-08-02" }] });
    const b = state({ checkIns: [{ date: "2026-08-02" }, { date: "2026-08-01" }] });
    expect(statesEqual(a, b)).toBe(true);
  });

  it("is false when check-ins differ", () => {
    const a = state({ checkIns: [{ date: "2026-08-01" }] });
    const b = state({ checkIns: [{ date: "2026-08-02" }] });
    expect(statesEqual(a, b)).toBe(false);
  });

  it("is false when a milestone's unlock status differs", () => {
    const a = state({
      milestones: [{ id: "d7", days: 7, label: "WEEK ONE", source: "builtin" }],
    });
    const b = state({
      milestones: [
        { id: "d7", days: 7, label: "WEEK ONE", source: "builtin", unlockedAt: "2026-08-01T00:00:00.000Z" },
      ],
    });
    expect(statesEqual(a, b)).toBe(false);
  });

  it("is false when a milestone's label differs", () => {
    const a = state({ milestones: [{ id: "d3", days: 3, label: "FIRST SPARK", source: "builtin" }] });
    const b = state({
      milestones: [{ id: "d3", days: 3, label: "FIRST SPARK (edited)", source: "builtin" }],
    });
    expect(statesEqual(a, b)).toBe(false);
  });

  it("is false when tombstones differ", () => {
    const a = state({ deletedMilestoneIds: [] });
    const b = state({ deletedMilestoneIds: ["d3"] });
    expect(statesEqual(a, b)).toBe(false);
  });
});
