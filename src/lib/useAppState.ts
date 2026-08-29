import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { todayStr } from "./dates";
import { reconcileFreezeState } from "./freeze";
import { findNewlyUnlocked, generateCustomMilestoneId } from "./milestones";
import { createInitialState, loadState, saveState } from "./storage";
import { currentStreak, getDayState, longestStreak, totalDaysLogged } from "./streak";
import type { DayState } from "./streak";
import {
  adoptDeviceId,
  fetchRemoteState,
  getOrCreateDeviceId,
  mergeStates,
  pushRemoteState,
  statesEqual,
} from "./sync";
import type { AppState, Milestone } from "./types";
import { FREEZE_BANK_CAP } from "./types";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [today, setToday] = useState(() => todayStr());
  const [freezeToastOpen, setFreezeToastOpen] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState<Milestone[]>([]);
  const [deviceId, setDeviceId] = useState<string>(() => getOrCreateDeviceId());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Keep "today" fresh across a real midnight rollover in a long-lived tab.
  useEffect(() => {
    const refresh = () => setToday(todayStr());
    const interval = setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const checkInDates = useMemo(
    () => new Set(state.checkIns.map((c) => c.date)),
    [state.checkIns],
  );

  const freeze = useMemo(
    () => reconcileFreezeState(checkInDates, today, FREEZE_BANK_CAP),
    [checkInDates, today],
  );
  const freezeUsedDates = useMemo(() => new Set(freeze.freezeUsedDates), [freeze.freezeUsedDates]);

  const currentStreakDays = useMemo(
    () => currentStreak(checkInDates, freezeUsedDates, today),
    [checkInDates, freezeUsedDates, today],
  );
  const longestStreakDays = useMemo(
    () => longestStreak(checkInDates, freezeUsedDates, today),
    [checkInDates, freezeUsedDates, today],
  );
  const totalDays = useMemo(() => totalDaysLogged(checkInDates), [checkInDates]);

  const dayState = useCallback(
    (date: string): DayState => getDayState(date, checkInDates, freezeUsedDates, today),
    [checkInDates, freezeUsedDates, today],
  );

  // The full snapshot — local state plus the freshly-reconciled freeze fields — used for
  // localStorage persistence, export, and Blobs sync alike.
  const canonicalState = useMemo<AppState>(
    () => ({
      ...state,
      freezeBank: freeze.freezeBank,
      freezeUsedDates: freeze.freezeUsedDates,
      lastEvaluatedWeek: freeze.lastEvaluatedWeek,
    }),
    [state, freeze],
  );

  useEffect(() => {
    saveState(canonicalState);
  }, [canonicalState]);

  // Refs so the sync effects below can read the latest local/canonical state without
  // depending on it (which would re-run the pull-and-merge cycle on every check-in).
  const canonicalStateRef = useRef(canonicalState);
  useEffect(() => {
    canonicalStateRef.current = canonicalState;
  }, [canonicalState]);

  // Gates the "push on change" effect until the initial pull+merge for this deviceId has
  // finished, so a stale pre-merge write can never race ahead of it and clobber the remote.
  const hasInitialSyncedRef = useRef(false);

  // Pull this device's remote blob, merge it into local (never destructive — union of
  // check-ins and milestones), then push the merged result back up. Runs on mount and again
  // whenever the user adopts a different sync id from Settings.
  useEffect(() => {
    let cancelled = false;
    hasInitialSyncedRef.current = false;
    setSyncStatus("syncing");

    (async () => {
      const remote = await fetchRemoteState(deviceId);
      if (cancelled) return;

      // What we push is a best-effort snapshot from just before this point — if the user
      // checked in during the fetch, that edit still lands locally (re-merged fresh inside
      // the updater below, so it's never lost) and reaches the remote on the very next push.
      const toPush = remote ? mergeStates(canonicalStateRef.current, remote) : canonicalStateRef.current;

      if (remote) {
        setState((prev) => {
          const merged = mergeStates(prev, remote);
          return statesEqual(prev, merged)
            ? prev
            : { ...prev, checkIns: merged.checkIns, milestones: merged.milestones };
        });
      }

      const ok = await pushRemoteState(deviceId, toPush);
      if (cancelled) return;
      hasInitialSyncedRef.current = true;
      setSyncStatus(ok ? "synced" : "offline");
    })();

    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  // Push any subsequent local change up, debounced so a burst of updates (e.g. reconciling
  // several days at once) doesn't fire a request per change.
  useEffect(() => {
    if (!hasInitialSyncedRef.current) return;
    const timer = setTimeout(() => {
      setSyncStatus("syncing");
      pushRemoteState(deviceId, canonicalState).then((ok) => {
        setSyncStatus(ok ? "synced" : "offline");
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [canonicalState, deviceId]);

  // Retry immediately when connectivity returns, rather than waiting for the next local change.
  useEffect(() => {
    function handleOnline() {
      if (!hasInitialSyncedRef.current) return;
      setSyncStatus("syncing");
      pushRemoteState(deviceId, canonicalStateRef.current).then((ok) => {
        setSyncStatus(ok ? "synced" : "offline");
      });
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [deviceId]);

  const setSyncDeviceId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    adoptDeviceId(trimmed);
    setDeviceId(trimmed);
  }, []);

  // Surface a one-time toast whenever the freeze bank increases after the initial load.
  const prevBankRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevBankRef.current === null) {
      prevBankRef.current = freeze.freezeBank;
      return;
    }
    if (freeze.freezeBank > prevBankRef.current) {
      setFreezeToastOpen(true);
    }
    prevBankRef.current = freeze.freezeBank;
  }, [freeze.freezeBank]);

  // Unlock (and queue a celebration for) any milestone the current streak has newly reached.
  // Guarded by a ref (not just the effect deps) so React's dev-mode double-invocation of
  // effects can never enqueue the same milestone's celebration twice.
  const queuedMilestoneIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const unlocked = findNewlyUnlocked(state.milestones, currentStreakDays).filter(
      (m) => !queuedMilestoneIdsRef.current.has(m.id),
    );
    if (unlocked.length === 0) return;
    for (const m of unlocked) queuedMilestoneIdsRef.current.add(m.id);

    const now = new Date().toISOString();
    const unlockedIds = new Set(unlocked.map((m) => m.id));
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        unlockedIds.has(m.id) ? { ...m, unlockedAt: now } : m,
      ),
    }));
    setCelebrationQueue((q) => [...q, ...unlocked.map((m) => ({ ...m, unlockedAt: now }))]);
  }, [currentStreakDays, state.milestones]);

  const markTodayDone = useCallback(() => {
    setState((prev) => {
      if (prev.checkIns.some((c) => c.date === today)) return prev;
      return { ...prev, checkIns: [...prev.checkIns, { date: today }] };
    });
  }, [today]);

  const addCustomReward = useCallback(
    (days: number, title: string, note?: string) => {
      setState((prev) => {
        const alreadyAchieved = days <= currentStreakDays;
        const milestone: Milestone = {
          id: generateCustomMilestoneId(),
          days,
          label: title,
          note,
          source: "custom",
          unlockedAt: alreadyAchieved ? new Date().toISOString() : undefined,
        };
        return { ...prev, milestones: [...prev.milestones, milestone] };
      });
    },
    [currentStreakDays],
  );

  const editCustomReward = useCallback(
    (id: string, updates: { days?: number; title?: string; note?: string }) => {
      setState((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === id && m.source === "custom"
            ? {
                ...m,
                days: updates.days ?? m.days,
                label: updates.title ?? m.label,
                note: updates.note ?? m.note,
              }
            : m,
        ),
      }));
    },
    [],
  );

  const deleteCustomReward = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => !(m.id === id && m.source === "custom")),
    }));
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const dismissFreezeToast = useCallback(() => setFreezeToastOpen(false), []);

  const dismissCelebration = useCallback(() => {
    setCelebrationQueue((q) => q.slice(1));
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(canonicalState, null, 2);
  }, [canonicalState]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as Partial<AppState>;
      if (!Array.isArray(parsed.checkIns)) return false;
      setState({
        ...createInitialState(),
        ...parsed,
        milestones: parsed.milestones?.length ? parsed.milestones : createInitialState().milestones,
      });
      queuedMilestoneIdsRef.current.clear();
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    setState(createInitialState());
    setCelebrationQueue([]);
    setFreezeToastOpen(false);
    prevBankRef.current = 0;
    queuedMilestoneIdsRef.current.clear();
  }, []);

  return {
    state,
    today,
    checkInDates,
    freezeUsedDates,
    freezeBank: freeze.freezeBank,
    currentStreakDays,
    longestStreakDays,
    totalDays,
    dayState,
    milestones: state.milestones,
    theme: state.theme ?? "light",
    isTodayDone: checkInDates.has(today),
    freezeToastOpen,
    dismissFreezeToast,
    celebration: celebrationQueue[0] ?? null,
    dismissCelebration,
    markTodayDone,
    addCustomReward,
    editCustomReward,
    deleteCustomReward,
    setTheme,
    exportData,
    importData,
    resetData,
    deviceId,
    syncStatus,
    setSyncDeviceId,
  };
}
