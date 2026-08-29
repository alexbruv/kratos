import { BadgeIcon } from "./BadgeIcon";
import { MemphisConfetti } from "./MemphisConfetti";
import type { Milestone } from "../lib/types";

export function CelebrationOverlay({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 text-center animate-[celebration-in_0.35s_ease-out]">
      <MemphisConfetti
        pieces={[
          { shape: "zigzag", color: "yellow", top: "10%", left: "10%", size: 44, rotate: -12 },
          { shape: "squiggle", color: "blue", top: "16%", right: "10%", size: 56, rotate: 6 },
          { shape: "dot", color: "red", top: "72%", left: "14%", size: 20 },
          { shape: "quarter-circle", color: "purple", top: "78%", right: "0%", size: 90 },
        ]}
      />

      <div className="relative z-10 flex flex-col items-center">
        {milestone.source === "builtin" ? (
          <BadgeIcon icon={milestone.badgeIcon} size={120} />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-[4px] border-border bg-purple text-4xl">
            🏆
          </div>
        )}

        <p className="mt-6 font-body text-sm font-bold uppercase tracking-[0.25em] text-text-muted">
          Milestone unlocked
        </p>
        <h1 className="mt-2 font-display text-3xl text-purple">{milestone.label}</h1>
        {milestone.note && (
          <p className="mt-2 max-w-xs font-body text-sm text-text-muted">{milestone.note}</p>
        )}

        <p className="mt-6 font-display text-6xl text-red">{milestone.days}</p>
        <p className="font-body text-sm font-semibold text-text-muted">day streak</p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-10 rounded-full border-[3px] border-border bg-red px-8 py-3 font-display text-sm text-white shadow-[4px_4px_0_0_var(--color-border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--color-border)]"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
