import { describe, expect, it } from "vitest";
import { monthlyRecap } from "../stats";

describe("monthlyRecap", () => {
  it("computes correct numbers for a partial (in-progress) month", () => {
    // August 2026: today is the 28th, so only 28 days have elapsed.
    const checkIns = new Set(["2026-08-01", "2026-08-02", "2026-08-27", "2026-08-28"]);
    const recap = monthlyRecap("2026-08-15", checkIns, new Set(), "2026-08-28");
    expect(recap.daysElapsed).toBe(28);
    expect(recap.daysTrained).toBe(4);
    expect(recap.longestStreakInMonth).toBe(2);
    expect(recap.monthLabel).toBe("August 2026");
  });

  it("computes correct numbers for a fully completed past month", () => {
    const checkIns = new Set(["2026-07-01", "2026-07-02", "2026-07-03"]);
    const recap = monthlyRecap("2026-07-15", checkIns, new Set(), "2026-08-28");
    expect(recap.daysElapsed).toBe(31); // all of July has elapsed
    expect(recap.daysTrained).toBe(3);
    expect(recap.longestStreakInMonth).toBe(3);
  });

  it("counts frozen days toward the longest streak but not toward days trained", () => {
    const checkIns = new Set(["2026-08-01", "2026-08-03"]);
    const frozen = new Set(["2026-08-02"]);
    const recap = monthlyRecap("2026-08-01", checkIns, frozen, "2026-08-28");
    expect(recap.daysTrained).toBe(2);
    expect(recap.longestStreakInMonth).toBe(3);
  });
});
