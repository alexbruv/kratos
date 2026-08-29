import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import type { Screen } from "./components/BottomNav";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { FreezeToast } from "./components/FreezeToast";
import { nextMilestone } from "./lib/milestones";
import { useAppState } from "./lib/useAppState";
import { Home } from "./screens/Home";
import { History } from "./screens/History";
import { Rewards } from "./screens/Rewards";
import { Settings } from "./screens/Settings";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const app = useAppState();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", app.theme === "dark");
  }, [app.theme]);

  const next = nextMilestone(app.milestones, app.currentStreakDays);

  return (
    <div className="mx-auto max-w-md">
      {screen === "home" && (
        <Home
          today={app.today}
          isTodayDone={app.isTodayDone}
          currentStreakDays={app.currentStreakDays}
          longestStreakDays={app.longestStreakDays}
          totalDays={app.totalDays}
          freezeBank={app.freezeBank}
          extraWorkoutsToday={app.extraWorkoutsToday}
          dayState={app.dayState}
          onMarkDone={app.markTodayDone}
          onAddExtraWorkout={app.addExtraWorkout}
          onRemoveExtraWorkout={app.removeLastExtraWorkoutToday}
          nextMilestoneDays={next?.days}
          nextMilestoneLabel={next?.label}
        />
      )}
      {screen === "history" && (
        <History
          today={app.today}
          checkInDates={app.checkInDates}
          freezeUsedDates={app.freezeUsedDates}
          dayState={app.dayState}
        />
      )}
      {screen === "rewards" && (
        <Rewards
          milestones={app.milestones}
          currentStreakDays={app.currentStreakDays}
          totalExtraWorkouts={app.totalExtraWorkouts}
          onAdd={app.addCustomReward}
          onEdit={app.editReward}
          onDelete={app.deleteReward}
        />
      )}
      {screen === "settings" && (
        <Settings
          theme={app.theme}
          onSetTheme={app.setTheme}
          onExport={app.exportData}
          onImport={app.importData}
          onReset={app.resetData}
          syncStatus={app.syncStatus}
        />
      )}

      <BottomNav screen={screen} onChange={setScreen} />

      <FreezeToast open={app.freezeToastOpen} onDismiss={app.dismissFreezeToast} />
      {app.celebration && (
        <CelebrationOverlay milestone={app.celebration} onDismiss={app.dismissCelebration} />
      )}
    </div>
  );
}

export default App;
