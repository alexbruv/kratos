import { mondayIndexOfWeek, monthDates, monthLabel } from "../lib/dates";
import type { DayState } from "../lib/streak";

function cellClasses(state: DayState): string {
  switch (state) {
    case "done":
      return "bg-red border-border";
    case "frozen":
      return "bg-blue border-border";
    case "missed":
      return "bg-transparent border-border/40";
    case "empty":
      return "bg-transparent border-text-muted/30 border-dashed";
  }
}

export function MonthGrid({
  referenceDate,
  earliestCheckIn,
  dayState,
}: {
  referenceDate: string;
  earliestCheckIn?: string;
  dayState: (date: string) => DayState;
}) {
  const dates = monthDates(referenceDate);
  const leading = mondayIndexOfWeek(dates[0]);
  const trailing = (7 - ((leading + dates.length) % 7)) % 7;
  const cells: (string | null)[] = [
    ...Array(leading).fill(null),
    ...dates,
    ...Array(trailing).fill(null),
  ];

  return (
    <div>
      <p className="mb-2 font-body text-xs font-bold uppercase tracking-wide text-text-muted">
        {monthLabel(referenceDate)}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />;
          const isPreHistory = earliestCheckIn !== undefined && date < earliestCheckIn;
          const state: DayState = isPreHistory ? "empty" : dayState(date);
          const isFrozen = state === "frozen";
          return (
            <div
              key={date}
              title={date}
              className={`relative aspect-square rounded-[5px] border-2 ${cellClasses(state)}`}
            >
              {isFrozen && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px]">
                  ❄
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
