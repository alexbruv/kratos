import { describe, expect, it } from "vitest";
import { addDaysStr, mondayOfWeek, sundayOfWeek, weekDates, weekIdForDate } from "../dates";

describe("dates", () => {
  it("addDaysStr adds and subtracts whole days across month/year boundaries", () => {
    expect(addDaysStr("2026-08-28", 1)).toBe("2026-08-29");
    expect(addDaysStr("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysStr("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysStr("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("weekDates always returns Monday..Sunday regardless of which day of the week is given", () => {
    // 2026-08-24 is a Monday, 2026-08-30 is the following Sunday.
    for (const d of ["2026-08-24", "2026-08-26", "2026-08-30"]) {
      expect(weekDates(d)).toEqual([
        "2026-08-24",
        "2026-08-25",
        "2026-08-26",
        "2026-08-27",
        "2026-08-28",
        "2026-08-29",
        "2026-08-30",
      ]);
    }
  });

  it("mondayOfWeek/sundayOfWeek bracket a fixed Mon-Sun calendar week, not a rolling window", () => {
    expect(mondayOfWeek("2026-08-26")).toBe("2026-08-24");
    expect(sundayOfWeek("2026-08-26")).toBe("2026-08-30");
  });

  it("weekIdForDate is stable across the whole week and changes at the Monday boundary", () => {
    const id = weekIdForDate("2026-08-24");
    expect(weekIdForDate("2026-08-26")).toBe(id);
    expect(weekIdForDate("2026-08-30")).toBe(id);
    expect(weekIdForDate("2026-08-31")).not.toBe(id);
  });
});
