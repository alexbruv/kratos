import { useState } from "react";

export interface RewardFormValues {
  days: number;
  title: string;
  note: string;
}

export function RewardForm({
  initial,
  submitLabel,
  thresholdLabel = "Days",
  thresholdPlaceholder = "730",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<RewardFormValues>;
  submitLabel: string;
  thresholdLabel?: string;
  thresholdPlaceholder?: string;
  onSubmit: (values: RewardFormValues) => void;
  onCancel: () => void;
}) {
  const [days, setDays] = useState(initial?.days?.toString() ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const daysNum = Number(days);
  const valid = title.trim().length > 0 && Number.isInteger(daysNum) && daysNum > 0;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ days: daysNum, title: title.trim(), note: note.trim() });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          {thresholdLabel}
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder={thresholdPlaceholder}
          className="rounded-lg border-[3px] border-border bg-bg px-3 py-2 font-body text-base text-text outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          Title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bali trip"
          maxLength={60}
          className="rounded-lg border-[3px] border-border bg-bg px-3 py-2 font-body text-base text-text outline-none"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          Note (optional)
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Two weeks, all-inclusive, booked for the day I hit it."
          maxLength={200}
          rows={2}
          className="resize-none rounded-lg border-[3px] border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none"
        />
      </label>
      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border-[3px] border-border bg-surface py-2.5 font-display text-xs text-text"
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 rounded-full border-[3px] border-border bg-purple py-2.5 font-display text-xs text-white shadow-[3px_3px_0_0_var(--color-border)] disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
