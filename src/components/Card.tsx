import type { ReactNode } from "react";

const SHADOW_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "shadow-[3px_3px_0_0_var(--color-border)]",
  md: "shadow-[5px_5px_0_0_var(--color-border)]",
  lg: "shadow-[8px_8px_0_0_var(--color-border)]",
};

export function Card({
  children,
  className = "",
  shadow = "md",
}: {
  children: ReactNode;
  className?: string;
  shadow?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`rounded-2xl border-[3px] border-border bg-surface ${SHADOW_CLASS[shadow]} ${className}`}
    >
      {children}
    </div>
  );
}
