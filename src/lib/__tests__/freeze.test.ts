import { describe, expect, it } from "vitest";
import { addDaysStr } from "../dates";
import { reconcileFreezeState } from "../freeze";
import { FREEZE_BANK_CAP } from "../types";

function fullWeek(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysStr(monday, i));
}

describe("reconcileFreezeState", () => {
  it("awards exactly +1 freeze for a perfect week (7/7, no freeze spent) once evaluated after it ends", () => {
    const checkIns = new Set(fullWeek("2026-08-24")); // Mon..Sun
    const result = reconcileFreezeState(checkIns, "2026-08-31"); // following Monday
    expect(result.freezeBank).toBe(1);
    expect(result.freezeUsedDates).toEqual([]);
  });

  it("awards the perfect-week freeze immediately once the week's Sunday itself is checked in, without waiting for the next day", () => {
    const checkIns = new Set(fullWeek("2026-08-24"));
    const result = reconcileFreezeState(checkIns, "2026-08-30"); // today is that Sunday
    expect(result.freezeBank).toBe(1);
  });

  it("does not award a freeze for an incomplete week still in progress", () => {
    const checkIns = new Set(["2026-08-24", "2026-08-25", "2026-08-26"]); // Mon-Wed only
    const result = reconcileFreezeState(checkIns, "2026-08-27"); // Thursday, week not over
    expect(result.freezeBank).toBe(0);
  });

  it("is idempotent / never double-counts a perfect week across repeated reconciliation calls mid-week and after", () => {
    const weekA = fullWeek("2026-08-24");
    const mid = reconcileFreezeState(new Set(weekA), "2026-08-27");
    expect(mid.freezeBank).toBe(0); // week not complete yet as of Thursday

    // Three back-to-back perfect weeks, continuously checked in (no gaps to spend freezes on).
    const threeWeeks = new Set([...weekA, ...fullWeek("2026-08-31"), ...fullWeek("2026-09-07")]);
    const afterFirst = reconcileFreezeState(threeWeeks, "2026-08-31");
    const afterAll = reconcileFreezeState(threeWeeks, "2026-09-14");
    expect(afterFirst.freezeBank).toBe(1);
    expect(afterAll.freezeBank).toBe(3); // exactly one freeze per perfect week, not inflated by re-evaluation
  });

  it("auto-consumes a freeze for a single missed past day, keeping it out of freezeUsedDates until spent", () => {
    // Perfect week A banks a freeze; week B has Monday missed but the rest checked in.
    const weekA = fullWeek("2026-08-24");
    const weekB = fullWeek("2026-08-31").filter((d) => d !== "2026-08-31"); // Monday missing
    const checkIns = new Set([...weekA, ...weekB]);
    const result = reconcileFreezeState(checkIns, "2026-09-07"); // Monday after week B
    expect(result.freezeUsedDates).toEqual(["2026-08-31"]);
    expect(result.freezeBank).toBe(0); // the 1 earned freeze was spent
  });

  it("does not award a new freeze for a week where a freeze was used, even if the other 6 days were checked in", () => {
    const weekA = fullWeek("2026-08-24");
    const weekB = fullWeek("2026-08-31").filter((d) => d !== "2026-08-31");
    const checkIns = new Set([...weekA, ...weekB]);
    const result = reconcileFreezeState(checkIns, "2026-09-07");
    // Only week A's freeze exists; week B used it and does not itself bank a new one.
    expect(result.freezeBank).toBe(0);
  });

  it("applies freezes to the earliest missed days first and leaves the rest of a multi-day gap uncovered once the bank runs out", () => {
    const weekA = fullWeek("2026-08-24"); // banks 1
    const weekB = fullWeek("2026-08-31"); // banks 1 more -> bank of 2 going into week C
    const weekC = fullWeek("2026-09-07").filter(
      (d) => !["2026-09-07", "2026-09-08", "2026-09-09"].includes(d),
    ); // Mon, Tue, Wed all missed
    const checkIns = new Set([...weekA, ...weekB, ...weekC]);
    const result = reconcileFreezeState(checkIns, "2026-09-14"); // Monday after week C
    expect(result.freezeUsedDates).toEqual(["2026-09-07", "2026-09-08"]);
    expect(result.freezeBank).toBe(0);
  });

  it("never applies a freeze to today, even when today is unmarked and the bank has balance", () => {
    const weekA = fullWeek("2026-08-24"); // banks 1
    const checkIns = new Set(weekA); // Monday of week B (today) is not checked in
    const result = reconcileFreezeState(checkIns, "2026-08-31");
    expect(result.freezeUsedDates).not.toContain("2026-08-31");
    expect(result.freezeBank).toBe(1); // freeze preserved, not spent on today
  });

  it("caps the freeze bank at the configured max even after further perfect weeks", () => {
    const weeks = ["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"];
    const checkIns = new Set(weeks.flatMap(fullWeek));
    const result = reconcileFreezeState(checkIns, "2026-09-28"); // after all 5 perfect weeks
    expect(result.freezeBank).toBe(FREEZE_BANK_CAP);
  });

  it("returns a zeroed state with no history", () => {
    const result = reconcileFreezeState(new Set(), "2026-08-28");
    expect(result).toEqual({ freezeBank: 0, freezeUsedDates: [], lastEvaluatedWeek: undefined });
  });
});
