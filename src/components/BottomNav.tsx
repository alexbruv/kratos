export type Screen = "home" | "history" | "rewards" | "settings";

const TABS: { id: Screen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "history", label: "History" },
  { id: "rewards", label: "Rewards" },
  { id: "settings", label: "Settings" },
];

function TabIcon({ id, active }: { id: Screen; active: boolean }) {
  const color = active ? "var(--color-red)" : "var(--color-text-muted)";
  const stroke = { stroke: color, strokeWidth: 6, fill: "none" } as const;
  switch (id) {
    case "home":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22">
          <path d="M6 15 L16 6 L26 15 V27 H6 Z" {...stroke} strokeLinejoin="round" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22">
          <rect x="5" y="6" width="22" height="21" rx="3" {...stroke} />
          <path d="M5 13 H27" stroke={color} strokeWidth="4" />
        </svg>
      );
    case "rewards":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22">
          <path d="M16 4 L20 12 L29 13 L22 19 L24 28 L16 23 L8 28 L10 19 L3 13 L12 12 Z" {...stroke} strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22">
          <circle cx="16" cy="16" r="6" {...stroke} />
          <path
            d="M16 3 V8 M16 24 V29 M3 16 H8 M24 16 H29 M6.5 6.5 L10 10 M22 22 L25.5 25.5 M25.5 6.5 L22 10 M10 22 L6.5 25.5"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function BottomNav({
  screen,
  onChange,
}: {
  screen: Screen;
  onChange: (screen: Screen) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-border bg-surface">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.id === screen;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 font-body text-[11px] font-semibold tracking-wide ${
                active ? "text-red" : "text-text-muted"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <TabIcon id={tab.id} active={active} />
              {tab.label.toUpperCase()}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
