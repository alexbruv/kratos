import { sortMilestones } from "./milestones";
import type { AppState, Milestone } from "./types";

const DEVICE_ID_KEY = "kratos:device-id";
const SYNC_ENDPOINT = "/api/sync";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The id a device's local data is filed under in Netlify Blobs. Persisted alongside — but
 * separately from — the app state itself, since it's an identity, not app data. */
export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable — fall through to a session-only id.
  }
  const id = generateId();
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore — sync will just re-generate an id next load.
  }
  return id;
}

export function adoptDeviceId(id: string): void {
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
}

export async function fetchRemoteState(deviceId: string): Promise<AppState | null> {
  try {
    const res = await fetch(`${SYNC_ENDPOINT}?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return null;
    if (!res.headers.get("content-type")?.includes("application/json")) return null;
    return (await res.json()) as AppState;
  } catch {
    return null;
  }
}

export async function pushRemoteState(deviceId: string, state: AppState): Promise<boolean> {
  try {
    const res = await fetch(`${SYNC_ENDPOINT}?deviceId=${encodeURIComponent(deviceId)}`, {
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

/** Local's descriptive fields win; unlocked status is OR'd, keeping the earlier timestamp. */
function mergeMilestone(remote: Milestone, local: Milestone): Milestone {
  return { ...local, unlockedAt: earliestTimestamp(remote.unlockedAt, local.unlockedAt) };
}

/**
 * Union of two states' check-ins and milestones — never discards data from either side.
 * Freeze fields aren't merged since they're always re-derived from check-ins; theme is a
 * per-device preference and stays local's.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const checkInDates = new Set([...local.checkIns, ...remote.checkIns].map((c) => c.date));
  const checkIns = [...checkInDates].sort().map((date) => ({ date }));

  const byId = new Map<string, Milestone>();
  for (const m of remote.milestones) byId.set(m.id, m);
  for (const m of local.milestones) {
    const existingRemote = byId.get(m.id);
    byId.set(m.id, existingRemote ? mergeMilestone(existingRemote, m) : m);
  }

  return {
    ...local,
    checkIns,
    milestones: sortMilestones([...byId.values()]),
  };
}

/** Cheap order-insensitive comparison of the parts mergeStates actually changes. */
export function statesEqual(a: AppState, b: AppState): boolean {
  const aCheckIns = [...a.checkIns].map((c) => c.date).sort();
  const bCheckIns = [...b.checkIns].map((c) => c.date).sort();
  if (JSON.stringify(aCheckIns) !== JSON.stringify(bCheckIns)) return false;

  const aM = sortMilestones(a.milestones).map((m) => `${m.id}:${m.unlockedAt ?? ""}`);
  const bM = sortMilestones(b.milestones).map((m) => `${m.id}:${m.unlockedAt ?? ""}`);
  return JSON.stringify(aM) === JSON.stringify(bM);
}
