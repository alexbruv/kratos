import type { DayState } from "../lib/streak";

const LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function dotClasses(state: DayState): string {
  switch (state) {
    case "done":
      return "bg-red border-border";
    case "frozen":
      return "bg-blue border-border";
    case "missed":
      return "bg-transparent border-border";
    case "empty":
      return "bg-transparent border-text-muted border-dashed";
  }
}

export function ThisWeekDots({ dates, dayState }: { dates: string[]; dayState: (d: string) => DayState }) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      {dates.map((date, i) => {
        const state = dayState(date);
        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <div
              className={`h-5 w-5 rounded-full border-2 ${dotClasses(state)}`}
              title={`${LABELS[i]}: ${state}`}
            />
            <span className="text-[10px] font-semibold text-text-muted">{LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
