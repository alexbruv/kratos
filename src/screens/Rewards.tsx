import { useState } from "react";
import { milestonesForMetric, nextMilestone } from "../lib/milestones";
import type { Milestone, MilestoneMetric } from "../lib/types";
import { BadgeIcon } from "../components/BadgeIcon";
import { Card } from "../components/Card";
import { RewardForm } from "../components/RewardForm";
import type { RewardFormValues } from "../components/RewardForm";
import { MemphisConfetti } from "../components/MemphisConfetti";

export function Rewards({
  milestones,
  currentStreakDays,
  totalExtraWorkouts,
  onAdd,
  onEdit,
  onDelete,
}: {
  milestones: Milestone[];
  currentStreakDays: number;
  totalExtraWorkouts: number;
  onAdd: (days: number, title: string, note: string | undefined, metric?: MilestoneMetric) => void;
  onEdit: (id: string, values: { days?: number; title?: string; note?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const streakMilestones = milestonesForMetric(milestones, "streak");
  const bonusMilestones = milestonesForMetric(milestones, "extraWorkouts");
  const nextStreak = nextMilestone(milestones, currentStreakDays, "streak");
  const nextBonus = nextMilestone(milestones, totalExtraWorkouts, "extraWorkouts");

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-5 pb-28 pt-6">
      <MemphisConfetti
        pieces={[{ shape: "dot", color: "yellow", top: "0%", left: "0%", size: 12 }]}
      />

      <h1 className="relative z-10 font-display text-2xl text-text">Rewards</h1>

      <RewardSection
        title="Streak milestones"
        addLabel="+ ADD REWARD"
        unitLabel="days"
        thresholdLabel="Days"
        thresholdPlaceholder="730"
        milestones={streakMilestones}
        next={nextStreak}
        currentValue={currentStreakDays}
        editingId={editingId}
        onStartEdit={setEditingId}
        onCancelEdit={() => setEditingId(null)}
        onSaveEdit={(id, values) => {
          onEdit(id, values);
          setEditingId(null);
        }}
        onDelete={onDelete}
        onAdd={(values) => onAdd(values.days, values.title, values.note || undefined, "streak")}
      />

      <div className="relative z-10 mt-8">
        <RewardSection
          title="Bonus: extra workouts"
          subtitle="Doesn't touch your streak — just for going above and beyond on a day."
          addLabel="+ ADD BONUS REWARD"
          unitLabel="extra workouts"
          thresholdLabel="Extra workouts"
          thresholdPlaceholder="50"
          milestones={bonusMilestones}
          next={nextBonus}
          currentValue={totalExtraWorkouts}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSaveEdit={(id, values) => {
            onEdit(id, values);
            setEditingId(null);
          }}
          onDelete={onDelete}
          onAdd={(values) =>
            onAdd(values.days, values.title, values.note || undefined, "extraWorkouts")
          }
        />
      </div>
    </div>
  );
}

function RewardSection({
  title,
  subtitle,
  addLabel,
  unitLabel,
  thresholdLabel,
  thresholdPlaceholder,
  milestones,
  next,
  currentValue,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  addLabel: string;
  unitLabel: string;
  thresholdLabel: string;
  thresholdPlaceholder: string;
  milestones: Milestone[];
  next?: Milestone;
  currentValue: number;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, values: { days?: number; title?: string; note?: string }) => void;
  onDelete: (id: string) => void;
  onAdd: (values: RewardFormValues) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm uppercase tracking-wide text-text">{title}</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-full border-[3px] border-border bg-purple px-3 py-1.5 font-display text-[10px] text-white shadow-[3px_3px_0_0_var(--color-border)]"
        >
          {addLabel}
        </button>
      </div>
      {subtitle && <p className="mt-1 font-body text-xs text-text-muted">{subtitle}</p>}

      {next && (
        <p className="mt-3 font-body text-sm text-text-muted">
          Next up: <span className="font-semibold text-purple">{next.label}</span> at {next.days}{" "}
          {unitLabel} ({Math.max(0, next.days - currentValue)} to go)
        </p>
      )}

      {showAddForm && (
        <Card className="mt-4 p-4">
          <RewardForm
            submitLabel="ADD"
            thresholdLabel={thresholdLabel}
            thresholdPlaceholder={thresholdPlaceholder}
            onCancel={() => setShowAddForm(false)}
            onSubmit={(values) => {
              onAdd(values);
              setShowAddForm(false);
            }}
          />
        </Card>
      )}

      {milestones.length === 0 && !showAddForm && (
        <p className="mt-4 font-body text-sm text-text-muted">No rewards here yet.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {milestones.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            unitLabel={unitLabel}
            isEditing={editingId === m.id}
            onStartEdit={() => onStartEdit(m.id)}
            onCancelEdit={onCancelEdit}
            onSaveEdit={(values) =>
              onSaveEdit(m.id, { days: values.days, title: values.title, note: values.note })
            }
            onDelete={() => onDelete(m.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MilestoneRow({
  milestone,
  unitLabel,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  milestone: Milestone;
  unitLabel: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (values: RewardFormValues) => void;
  onDelete: () => void;
}) {
  const unlocked = Boolean(milestone.unlockedAt);

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
        <p className="truncate font-display text-sm text-text">
          {milestone.label} {unlocked && <span className="text-base">✓</span>}
        </p>
        <p className="font-body text-xs font-semibold text-text-muted">
          {milestone.days} {unitLabel} {unlocked ? "· unlocked" : "· locked"}
        </p>
        {milestone.note && (
          <p className="mt-0.5 truncate font-body text-xs text-text-muted">{milestone.note}</p>
        )}
      </div>
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
    </Card>
  );
}
