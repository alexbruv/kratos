import { milestoneMetric, sortMilestones } from "./milestones";
import type { AppState, ExtraWorkout, Milestone } from "./types";

const SYNC_ENDPOINT = "/api/sync";

/**
 * This app is single-user by design (no accounts), so every device syncs to the same fixed
 * blob rather than a per-device id that would need manually pairing devices together. Change
 * this constant (and clear the old blob) if this code is ever reused for more than one person.
 */
export const SYNC_ID = "2c77f99b-87ff-4eaa-90e6-6afc5b5d4847";

/** Fills in any field missing from an older stored payload, so a schema addition (like
 * extraWorkouts) can never crash mergeStates on a blob written before it existed. */
function normalizeRemoteState(data: Partial<AppState>): AppState {
  return {
    checkIns: data.checkIns ?? [],
    extraWorkouts: data.extraWorkouts ?? [],
    milestones: data.milestones ?? [],
    deletedMilestoneIds: data.deletedMilestoneIds ?? [],
    freezeBank: data.freezeBank ?? 0,
    freezeUsedDates: data.freezeUsedDates ?? [],
    lastEvaluatedWeek: data.lastEvaluatedWeek,
    theme: data.theme,
  };
}

export async function fetchRemoteState(): Promise<AppState | null> {
  try {
    const res = await fetch(`${SYNC_ENDPOINT}?deviceId=${SYNC_ID}`);
    if (!res.ok) return null;
    if (!res.headers.get("content-type")?.includes("application/json")) return null;
    return normalizeRemoteState((await res.json()) as Partial<AppState>);
  } catch {
    return null;
  }
}

export async function pushRemoteState(state: AppState): Promise<boolean> {
  try {
    const res = await fetch(`${SYNC_ENDPOINT}?deviceId=${SYNC_ID}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function earliestTimestamp(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

/**
 * Whichever side was edited more recently wins on descriptive fields (label/days/note) — an
 * edited version always beats an untouched default, since a fresh device's seeded builtin
 * ladder has no updatedAt at all. Unlocked status is OR'd, keeping the earlier timestamp.
 */
function mergeMilestone(remote: Milestone, local: Milestone): Milestone {
  const remoteIsNewerEdit =
    remote.updatedAt !== undefined && (local.updatedAt === undefined || remote.updatedAt > local.updatedAt);
  const base = remoteIsNewerEdit ? remote : local;
  return { ...base, unlockedAt: earliestTimestamp(remote.unlockedAt, local.unlockedAt) };
}

function sortExtraWorkouts(entries: ExtraWorkout[]): ExtraWorkout[] {
  return [...entries].sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1));
}

/**
 * Union of two states' check-ins, extra workouts, and milestones — never discards data from
 * either side, except for milestones either side has explicitly deleted (deletion is permanent
 * and always wins). Freeze fields aren't merged since they're always re-derived from check-ins;
 * theme is a per-device preference and stays local's.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const checkInDates = new Set([...local.checkIns, ...remote.checkIns].map((c) => c.date));
  const checkIns = [...checkInDates].sort().map((date) => ({ date }));

  // Extra workouts are a log, not a set — several can share a date, so they merge by unique id
  // rather than deduping by date the way check-ins do.
  const extraWorkoutsById = new Map<string, ExtraWorkout>();
  for (const w of [...local.extraWorkouts, ...remote.extraWorkouts]) extraWorkoutsById.set(w.id, w);
  const extraWorkouts = sortExtraWorkouts([...extraWorkoutsById.values()]);

  const deletedMilestoneIds = [
    ...new Set([...local.deletedMilestoneIds, ...remote.deletedMilestoneIds]),
  ];
  const deletedSet = new Set(deletedMilestoneIds);

  const byId = new Map<string, Milestone>();
  for (const m of remote.milestones) byId.set(m.id, m);
  for (const m of local.milestones) {
    const existingRemote = byId.get(m.id);
    byId.set(m.id, existingRemote ? mergeMilestone(existingRemote, m) : m);
  }

  return {
    ...local,
    checkIns,
    extraWorkouts,
    milestones: sortMilestones([...byId.values()].filter((m) => !deletedSet.has(m.id))),
    deletedMilestoneIds,
  };
}

/** Cheap order-insensitive comparison of the parts mergeStates actually changes. */
export function statesEqual(a: AppState, b: AppState): boolean {
  const aCheckIns = [...a.checkIns].map((c) => c.date).sort();
  const bCheckIns = [...b.checkIns].map((c) => c.date).sort();
  if (JSON.stringify(aCheckIns) !== JSON.stringify(bCheckIns)) return false;

  const aExtra = [...a.extraWorkouts.map((w) => w.id)].sort();
  const bExtra = [...b.extraWorkouts.map((w) => w.id)].sort();
  if (JSON.stringify(aExtra) !== JSON.stringify(bExtra)) return false;

  const aDeleted = [...a.deletedMilestoneIds].sort();
  const bDeleted = [...b.deletedMilestoneIds].sort();
  if (JSON.stringify(aDeleted) !== JSON.stringify(bDeleted)) return false;

  const aM = sortMilestones(a.milestones).map(
    (m) => `${m.id}:${milestoneMetric(m)}:${m.unlockedAt ?? ""}:${m.label}:${m.days}:${m.note ?? ""}`,
  );
  const bM = sortMilestones(b.milestones).map(
    (m) => `${m.id}:${milestoneMetric(m)}:${m.unlockedAt ?? ""}:${m.label}:${m.days}:${m.note ?? ""}`,
  );
  return JSON.stringify(aM) === JSON.stringify(bM);
}
