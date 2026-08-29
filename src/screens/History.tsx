import { lastNMonths } from "../lib/dates";
import { monthlyRecap } from "../lib/stats";
import type { DayState } from "../lib/streak";
import { Card } from "../components/Card";
import { MonthGrid } from "../components/MonthGrid";
import { MemphisConfetti } from "../components/MemphisConfetti";

const MONTHS_SHOWN = 6;

export function History({
  today,
  checkInDates,
  freezeUsedDates,
  dayState,
}: {
  today: string;
  checkInDates: ReadonlySet<string>;
  freezeUsedDates: ReadonlySet<string>;
  dayState: (date: string) => DayState;
}) {
  const recap = monthlyRecap(today, checkInDates, freezeUsedDates, today);
  const earliestCheckIn = checkInDates.size
    ? [...checkInDates].reduce((a, b) => (b < a ? b : a))
    : undefined;
  const months = lastNMonths(today, MONTHS_SHOWN);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-5 pb-28 pt-6">
      <MemphisConfetti
        pieces={[{ shape: "squiggle", color: "blue", top: "2%", right: "6%", size: 50, rotate: -6 }]}
      />

      <h1 className="relative z-10 font-display text-2xl text-text">History</h1>

      <Card className="relative z-10 mt-4 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          {recap.monthLabel} recap
        </p>
        <div className="mt-2 flex items-end gap-4">
          <div>
            <p className="font-display text-3xl text-red">
              {recap.daysTrained}
              <span className="text-xl text-text-muted">/{recap.daysElapsed}</span>
            </p>
            <p className="font-body text-[11px] font-semibold text-text-muted">days trained</p>
          </div>
          <div>
            <p className="font-display text-3xl text-purple">{recap.longestStreakInMonth}</p>
            <p className="font-body text-[11px] font-semibold text-text-muted">
              longest streak
            </p>
          </div>
        </div>
      </Card>

      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-4 font-body text-[11px] font-semibold text-text-muted">
        <Legend swatchClass="bg-red border-border" label="Done" />
        <Legend swatchClass="bg-blue border-border" label="Frozen" />
        <Legend swatchClass="border-border/40" label="Missed" />
        <Legend swatchClass="border-text-muted/30 border-dashed" label="Future" />
      </div>

      <div className="relative z-10 mt-5 flex flex-col gap-6">
        {months.map((m) => (
          <MonthGrid key={m} referenceDate={m} earliestCheckIn={earliestCheckIn} dayState={dayState} />
        ))}
      </div>
    </div>
  );
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-[3px] border-2 ${swatchClass}`} />
      {label}
    </span>
  );
}
