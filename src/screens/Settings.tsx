import { useRef, useState } from "react";
import { Card } from "../components/Card";
import type { SyncStatus } from "../lib/useAppState";

const STATUS_LABEL: Record<SyncStatus, string> = {
  idle: "Not synced yet",
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline — saved on this device",
  error: "Sync error — saved on this device",
};

const STATUS_DOT: Record<SyncStatus, string> = {
  idle: "bg-text-muted",
  syncing: "bg-yellow",
  synced: "bg-blue",
  offline: "bg-text-muted",
  error: "bg-red",
};

export function Settings({
  theme,
  onSetTheme,
  onExport,
  onImport,
  onReset,
  deviceId,
  syncStatus,
  onSetSyncDeviceId,
}: {
  theme: "light" | "dark";
  onSetTheme: (theme: "light" | "dark") => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onReset: () => void;
  deviceId: string;
  syncStatus: SyncStatus;
  onSetSyncDeviceId: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopyId() {
    navigator.clipboard
      ?.writeText(deviceId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  function handleLinkDevice() {
    if (!linkInput.trim()) return;
    onSetSyncDeviceId(linkInput.trim());
    setLinkInput("");
  }

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
        <div className="flex items-center justify-between">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
            Sync
          </p>
          <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-muted">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[syncStatus]}`} />
            {STATUS_LABEL[syncStatus]}
          </span>
        </div>
        <p className="mt-1 font-body text-sm text-text-muted">
          Your data still lives on this device first — nothing here needs a connection. When
          you're online, it also backs up to the cloud under this device's sync ID, so you can
          carry your streak to another device by pasting the same ID there.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border-[3px] border-border bg-bg px-3 py-2 font-body text-xs text-text">
            {deviceId}
          </code>
          <button
            type="button"
            onClick={handleCopyId}
            className="shrink-0 rounded-full border-[3px] border-border bg-surface px-3 py-2 font-display text-[10px] text-text"
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste a sync ID from another device"
            className="min-w-0 flex-1 rounded-lg border-[3px] border-border bg-bg px-3 py-2 font-body text-xs text-text outline-none"
          />
          <button
            type="button"
            onClick={handleLinkDevice}
            disabled={!linkInput.trim()}
            className="shrink-0 rounded-full border-[3px] border-border bg-purple px-3 py-2 font-display text-[10px] text-white disabled:opacity-40"
          >
            LINK
          </button>
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <p className="font-body text-xs font-bold uppercase tracking-wide text-text-muted">
          Your data
        </p>
        <p className="mt-1 font-body text-sm text-text-muted">
          Export a backup any time — cheap insurance on top of sync.
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
