import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { todayStr } from "./dates";
import { reconcileFreezeState } from "./freeze";
import { findNewlyUnlocked, generateCustomMilestoneId } from "./milestones";
import { createInitialState, loadState, saveState } from "./storage";
import { currentStreak, getDayState, longestStreak, totalDaysLogged } from "./streak";
import type { DayState } from "./streak";
import type { AppState, Milestone } from "./types";
import { FREEZE_BANK_CAP } from "./types";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [today, setToday] = useState(() => todayStr());
  const [freezeToastOpen, setFreezeToastOpen] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState<Milestone[]>([]);

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

  // Persist the canonical snapshot (including the freshly-reconciled freeze fields) on any change.
  useEffect(() => {
    saveState({
      ...state,
      freezeBank: freeze.freezeBank,
      freezeUsedDates: freeze.freezeUsedDates,
      lastEvaluatedWeek: freeze.lastEvaluatedWeek,
    });
  }, [state, freeze]);

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
    return JSON.stringify(
      {
        ...state,
        freezeBank: freeze.freezeBank,
        freezeUsedDates: freeze.freezeUsedDates,
        lastEvaluatedWeek: freeze.lastEvaluatedWeek,
      },
      null,
      2,
    );
  }, [state, freeze]);

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
  };
}
