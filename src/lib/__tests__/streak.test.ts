import { describe, expect, it } from "vitest";
import { currentStreak, getDayState, longestStreak, totalDaysLogged } from "../streak";

describe("currentStreak", () => {
  it("counts consecutive protected days ending today when today is checked in", () => {
    const checkIns = new Set(["2026-08-26", "2026-08-27", "2026-08-28"]);
    expect(currentStreak(checkIns, new Set(), "2026-08-28")).toBe(3);
  });

  it("doesn't zero the streak just because today isn't marked yet", () => {
    const checkIns = new Set(["2026-08-26", "2026-08-27"]);
    expect(currentStreak(checkIns, new Set(), "2026-08-28")).toBe(2);
  });

  it("resets to 0 when yesterday was missed with no freeze covering it", () => {
    const checkIns = new Set(["2026-08-20", "2026-08-21"]);
    expect(currentStreak(checkIns, new Set(), "2026-08-28")).toBe(0);
  });

  it("treats a frozen day as continuing the streak", () => {
    const checkIns = new Set(["2026-08-26", "2026-08-28"]);
    const frozen = new Set(["2026-08-27"]);
    expect(currentStreak(checkIns, frozen, "2026-08-28")).toBe(3);
  });

  it("is 0 with no history at all", () => {
    expect(currentStreak(new Set(), new Set(), "2026-08-28")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the longest run anywhere in history, even if the current streak is shorter", () => {
    const checkIns = new Set([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      // gap
      "2026-08-27",
      "2026-08-28",
    ]);
    expect(longestStreak(checkIns, new Set(), "2026-08-28")).toBe(5);
  });

  it("counts frozen days toward the longest run", () => {
    const checkIns = new Set(["2026-08-24", "2026-08-26"]);
    const frozen = new Set(["2026-08-25"]);
    expect(longestStreak(checkIns, frozen, "2026-08-28")).toBe(3);
  });
});

describe("totalDaysLogged", () => {
  it("counts only real check-ins, not frozen days", () => {
    const checkIns = new Set(["2026-08-24", "2026-08-26"]);
    expect(totalDaysLogged(checkIns)).toBe(2);
  });
});

describe("getDayState", () => {
  const checkIns = new Set(["2026-08-25", "2026-08-28"]);
  const frozen = new Set(["2026-08-26"]);
  const today = "2026-08-28";

  it("classifies a real check-in as done", () => {
    expect(getDayState("2026-08-25", checkIns, frozen, today)).toBe("done");
  });

  it("classifies a freeze-covered day as frozen, not done or missed", () => {
    expect(getDayState("2026-08-26", checkIns, frozen, today)).toBe("frozen");
  });

  it("classifies an uncovered past day as missed", () => {
    expect(getDayState("2026-08-27", checkIns, frozen, today)).toBe("missed");
  });

  it("classifies today as done once checked in", () => {
    expect(getDayState("2026-08-28", checkIns, frozen, today)).toBe("done");
  });

  it("classifies today as empty (not missed) when not yet checked in", () => {
    expect(getDayState("2026-08-28", new Set(), new Set(), today)).toBe("empty");
  });

  it("classifies a future day as empty", () => {
    expect(getDayState("2026-08-29", checkIns, frozen, today)).toBe("empty");
  });
});
