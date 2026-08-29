import { useRef, useState } from "react";
import { Card } from "../components/Card";

export function Settings({
  theme,
  onSetTheme,
  onExport,
  onImport,
  onReset,
}: {
  theme: "light" | "dark";
  onSetTheme: (theme: "light" | "dark") => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleExport() {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kratos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((text) => {
      const ok = onImport(text);
      setImportMessage(ok ? "Data imported." : "That file couldn't be read.");
    });
  }

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-6">
      <h1 className="font-display text-2xl text-text">Settings</h1>

      <Card className="mt-5 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          Appearance
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => onSetTheme("light")}
            className={`flex-1 rounded-full border-[3px] border-border py-2.5 font-display text-xs ${
              theme === "light" ? "bg-red text-white" : "bg-surface text-text"
            }`}
          >
            LIGHT
          </button>
          <button
            type="button"
            onClick={() => onSetTheme("dark")}
            className={`flex-1 rounded-full border-[3px] border-border py-2.5 font-display text-xs ${
              theme === "dark" ? "bg-red text-white" : "bg-surface text-text"
            }`}
          >
            DARK
          </button>
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          Your data
        </p>
        <p className="mt-1 font-body text-sm text-text-muted">
          Everything lives on this device only. Export a backup before clearing your browser
          data or switching devices.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 rounded-full border-[3px] border-border bg-blue py-2.5 font-display text-xs text-white shadow-[3px_3px_0_0_var(--color-border)]"
          >
            EXPORT
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-full border-[3px] border-border bg-surface py-2.5 font-display text-xs text-text"
          >
            IMPORT
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {importMessage && (
          <p className="mt-2 font-body text-xs font-semibold text-text-muted">{importMessage}</p>
        )}
      </Card>

      <Card className="mt-4 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          About
        </p>
        <p className="mt-1 font-body text-sm text-text-muted">
          Kratos — one tap a day, one streak to protect. No accounts, no cloud, no tracking
          depth. Just today's workout.
        </p>
      </Card>

      <Card className="mt-4 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-red">
          Danger zone
        </p>
        {confirmingReset ? (
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="flex-1 rounded-full border-[3px] border-border bg-surface py-2.5 font-display text-xs text-text"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => {
                onReset();
                setConfirmingReset(false);
              }}
              className="flex-1 rounded-full border-[3px] border-border bg-red py-2.5 font-display text-xs text-white"
            >
              CONFIRM RESET
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="mt-2 w-full rounded-full border-[3px] border-border bg-surface py-2.5 font-display text-xs text-red"
          >
            RESET ALL DATA
          </button>
        )}
      </Card>
    </div>
  );
}
