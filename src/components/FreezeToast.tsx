import { useEffect } from "react";

export function FreezeToast({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 animate-[toast-in_0.25s_ease-out]">
      <div className="flex items-center gap-2 rounded-full border-[3px] border-border bg-yellow px-4 py-2 text-ink-on-accent shadow-[4px_4px_0_0_var(--color-border)]">
        <span aria-hidden="true">🧊</span>
        <span className="font-body text-sm font-bold">Perfect week! +1 freeze banked.</span>
      </div>
    </div>
  );
}
