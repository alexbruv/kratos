import { weekDates } from "../lib/dates";
import { quoteForDate } from "../lib/quotes";
import type { DayState } from "../lib/streak";
import { ThisWeekDots } from "../components/ThisWeekDots";
import { MemphisConfetti } from "../components/MemphisConfetti";

interface HomeProps {
  today: string;
  isTodayDone: boolean;
  currentStreakDays: number;
  longestStreakDays: number;
  totalDays: number;
  freezeBank: number;
  extraWorkoutsToday: number;
  dayState: (date: string) => DayState;
  onMarkDone: () => void;
  onAddExtraWorkout: () => void;
  onRemoveExtraWorkout: () => void;
  nextMilestoneDays?: number;
  nextMilestoneLabel?: string;
}

export function Home({
  today,
  isTodayDone,
  currentStreakDays,
  longestStreakDays,
  totalDays,
  freezeBank,
  extraWorkoutsToday,
  dayState,
  onMarkDone,
  onAddExtraWorkout,
  onRemoveExtraWorkout,
  nextMilestoneDays,
  nextMilestoneLabel,
}: HomeProps) {
  const quote = quoteForDate(today);
  const days = weekDates(today);
  const daysUntilNext =
    nextMilestoneDays !== undefined ? nextMilestoneDays - currentStreakDays : undefined;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-5 pb-28 pt-6">
      <MemphisConfetti
        pieces={[
          { shape: "zigzag", color: "purple", top: "6%", right: "8%", size: 40, rotate: 8 },
          { shape: "dot", color: "yellow", top: "48%", left: "4%", size: 14 },
        ]}
      />

      <header className="relative z-10 flex items-center justify-between">
        <p className="font-body text-sm font-semibold text-text-muted">
          {isTodayDone ? "Today's workout is logged." : "Ready when you are."}
        </p>
        <div
          className="flex items-center gap-1.5 rounded-full border-[3px] border-border bg-yellow px-3 py-1 text-ink-on-accent"
          aria-label={`${freezeBank} freeze days available`}
        >
          <SnowflakeIcon />
          <span className="font-display text-sm">{freezeBank}</span>
        </div>
      </header>

      <div className="relative z-10 mt-6 flex flex-col items-center">
        <span className="font-body text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          Current streak
        </span>
        <span className="font-display text-[5.5rem] leading-none text-red">
          {currentStreakDays}
        </span>
        <span className="font-body text-sm font-semibold text-text-muted">
          {currentStreakDays === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="relative z-10 mt-5">
        <ThisWeekDots dates={days} dayState={dayState} />
      </div>

      <div className="relative z-10 mt-7 flex justify-center">
        <button
          type="button"
          onClick={onMarkDone}
          disabled={isTodayDone}
          className={`flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-full border-[4px] border-border font-display text-xl leading-tight text-white shadow-[6px_6px_0_0_var(--color-border)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0_0_var(--color-border)] disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[6px_6px_0_0_var(--color-border)] ${
            isTodayDone ? "bg-purple" : "bg-red"
          }`}
        >
          {isTodayDone ? (
            <>
              <CheckIcon />
              <span>DONE</span>
            </>
          ) : (
            <>
              <span>MARK</span>
              <span>TODAY</span>
              <span>DONE</span>
            </>
          )}
        </button>
      </div>

      <p className="relative z-10 mx-auto mt-7 max-w-[26rem] text-center font-body text-sm italic text-text-muted">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="relative z-10 mt-auto grid grid-cols-2 gap-3 pt-6">
        <div className="rounded-xl border-[3px] border-border bg-surface px-3 py-2 text-center">
          <p className="font-display text-2xl text-purple">{longestStreakDays}</p>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Longest streak
          </p>
        </div>
        <div className="rounded-xl border-[3px] border-border bg-surface px-3 py-2 text-center">
          <p className="font-display text-2xl text-blue">{totalDays}</p>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Total workouts
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between rounded-xl border-[3px] border-border bg-surface px-3 py-2">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Extra workouts today
          </p>
          <p className="font-display text-xl text-blue">{extraWorkoutsToday}</p>
        </div>
        <div className="flex items-center gap-2">
          {extraWorkoutsToday > 0 && (
            <button
              type="button"
              onClick={onRemoveExtraWorkout}
              aria-label="Remove last extra workout logged today"
              className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-border bg-bg font-display text-base text-text"
            >
              −
            </button>
          )}
          <button
            type="button"
            onClick={onAddExtraWorkout}
            aria-label="Log an extra workout"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-border bg-blue font-display text-base text-white"
          >
            +
          </button>
        </div>
      </div>

      {nextMilestoneLabel && daysUntilNext !== undefined && (
        <p className="relative z-10 mt-3 text-center font-body text-xs font-semibold text-text-muted">
          {daysUntilNext} {daysUntilNext === 1 ? "day" : "days"} to{" "}
          <span className="text-purple">{nextMilestoneLabel}</span>
        </p>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <path
        d="M6 17 L13 24 L26 9"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnowflakeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="4" y1="7" x2="20" y2="17" />
        <line x1="20" y1="7" x2="4" y2="17" />
      </g>
    </svg>
  );
}
