import { useState } from "react";
import { sortMilestones } from "../lib/milestones";
import type { Milestone } from "../lib/types";
import { BadgeIcon } from "../components/BadgeIcon";
import { Card } from "../components/Card";
import { RewardForm } from "../components/RewardForm";
import type { RewardFormValues } from "../components/RewardForm";
import { MemphisConfetti } from "../components/MemphisConfetti";

export function Rewards({
  milestones,
  currentStreakDays,
  onAdd,
  onEdit,
  onDelete,
}: {
  milestones: Milestone[];
  currentStreakDays: number;
  onAdd: (days: number, title: string, note?: string) => void;
  onEdit: (id: string, values: { days?: number; title?: string; note?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = sortMilestones(milestones);
  const next = sorted.find((m) => !m.unlockedAt);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-5 pb-28 pt-6">
      <MemphisConfetti
        pieces={[{ shape: "dot", color: "yellow", top: "0%", left: "0%", size: 12 }]}
      />

      <div className="relative z-10 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text">Rewards</h1>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-full border-[3px] border-border bg-purple px-4 py-2 font-display text-xs text-white shadow-[3px_3px_0_0_var(--color-border)]"
        >
          + ADD REWARD
        </button>
      </div>

      {next && (
        <p className="relative z-10 mt-3 font-body text-sm text-text-muted">
          Next up: <span className="font-semibold text-purple">{next.label}</span> at{" "}
          {next.days} days ({Math.max(0, next.days - currentStreakDays)} to go)
        </p>
      )}

      {showAddForm && (
        <Card className="relative z-10 mt-4 p-4">
          <RewardForm
            submitLabel="ADD"
            onCancel={() => setShowAddForm(false)}
            onSubmit={(values: RewardFormValues) => {
              onAdd(values.days, values.title, values.note || undefined);
              setShowAddForm(false);
            }}
          />
        </Card>
      )}

      <div className="relative z-10 mt-5 flex flex-col gap-3">
        {sorted.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            isEditing={editingId === m.id}
            onStartEdit={() => setEditingId(m.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={(values) => {
              onEdit(m.id, { days: values.days, title: values.title, note: values.note });
              setEditingId(null);
            }}
            onDelete={() => onDelete(m.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MilestoneRow({
  milestone,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  milestone: Milestone;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (values: RewardFormValues) => void;
  onDelete: () => void;
}) {
  const unlocked = Boolean(milestone.unlockedAt);
  const isCustom = milestone.source === "custom";

  if (isEditing) {
    return (
      <Card className="p-4">
        <RewardForm
          submitLabel="SAVE"
          initial={{ days: milestone.days, title: milestone.label, note: milestone.note ?? "" }}
          onCancel={onCancelEdit}
          onSubmit={onSaveEdit}
        />
      </Card>
    );
  }

  return (
    <Card className={`flex items-center gap-3 p-3 ${unlocked ? "" : "opacity-55"}`} shadow="sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-[3px] border-border bg-bg">
        {milestone.source === "builtin" ? (
          <BadgeIcon icon={milestone.badgeIcon} size={40} />
        ) : (
          <span className="font-display text-lg text-purple">{milestone.days}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm text-text">{milestone.label}</p>
        <p className="font-body text-xs font-semibold text-text-muted">
          {milestone.days} days {unlocked ? "· unlocked" : "· locked"}
        </p>
        {milestone.note && (
          <p className="mt-0.5 truncate font-body text-xs text-text-muted">{milestone.note}</p>
        )}
      </div>
      {unlocked && <span className="shrink-0 text-lg">✓</span>}
      {isCustom && (
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onStartEdit}
            aria-label={`Edit ${milestone.label}`}
            className="rounded-full border-2 border-border bg-surface px-2 py-0.5 font-body text-[10px] font-bold"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${milestone.label}`}
            className="rounded-full border-2 border-border bg-surface px-2 py-0.5 font-body text-[10px] font-bold text-red"
          >
            DEL
          </button>
        </div>
      )}
    </Card>
  );
}
