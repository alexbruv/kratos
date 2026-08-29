type BadgeKey = "spark" | "flag" | "star" | "triangle" | "diamond" | "sun" | "bolt" | "crown";

const COLOR_VAR = "var(--color-purple)";
const INK_VAR = "var(--color-border)";

function Spark() {
  return (
    <path
      d="M50 8 L61 39 L92 50 L61 61 L50 92 L39 61 L8 50 L39 39 Z"
      fill={COLOR_VAR}
      stroke={INK_VAR}
      strokeWidth="5"
      strokeLinejoin="round"
    />
  );
}
function Flag() {
  return (
    <g stroke={INK_VAR} strokeWidth="5" strokeLinejoin="round">
      <line x1="28" y1="12" x2="28" y2="90" strokeLinecap="round" />
      <path d="M28 16 L82 26 L60 40 L82 54 L28 62 Z" fill={COLOR_VAR} />
    </g>
  );
}
function Star() {
  return (
    <path
      d="M50 6 L61 38 L95 38 L67 58 L78 90 L50 70 L22 90 L33 58 L5 38 L39 38 Z"
      fill={COLOR_VAR}
      stroke={INK_VAR}
      strokeWidth="5"
      strokeLinejoin="round"
    />
  );
}
function TriangleStack() {
  return (
    <g stroke={INK_VAR} strokeWidth="5" strokeLinejoin="round">
      <path d="M50 8 L78 56 L22 56 Z" fill={COLOR_VAR} />
      <path d="M50 40 L90 92 L10 92 Z" fill={COLOR_VAR} opacity="0.55" />
    </g>
  );
}
function Diamond() {
  return (
    <path
      d="M50 6 L94 50 L50 94 L6 50 Z"
      fill={COLOR_VAR}
      stroke={INK_VAR}
      strokeWidth="5"
      strokeLinejoin="round"
    />
  );
}
function Sun() {
  return (
    <g stroke={INK_VAR} strokeWidth="5" strokeLinejoin="round">
      <circle cx="50" cy="50" r="24" fill={COLOR_VAR} />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 50 + Math.cos(angle) * 32;
        const y1 = 50 + Math.sin(angle) * 32;
        const x2 = 50 + Math.cos(angle) * 46;
        const y2 = 50 + Math.sin(angle) * 46;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
      })}
    </g>
  );
}
function Bolt() {
  return (
    <path
      d="M58 4 L20 56 L46 56 L38 96 L82 42 L54 42 Z"
      fill={COLOR_VAR}
      stroke={INK_VAR}
      strokeWidth="5"
      strokeLinejoin="round"
    />
  );
}
function Crown() {
  return (
    <g stroke={INK_VAR} strokeWidth="5" strokeLinejoin="round">
      <path d="M12 40 L32 58 L50 24 L68 58 L88 40 L82 82 L18 82 Z" fill={COLOR_VAR} />
    </g>
  );
}

const ICONS: Record<BadgeKey, () => React.JSX.Element> = {
  spark: Spark,
  flag: Flag,
  star: Star,
  triangle: TriangleStack,
  diamond: Diamond,
  sun: Sun,
  bolt: Bolt,
  crown: Crown,
};

export function BadgeIcon({
  icon,
  size = 64,
  className = "",
}: {
  icon?: string;
  size?: number;
  className?: string;
}) {
  const Icon = (icon && ICONS[icon as BadgeKey]) || Star;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <Icon />
    </svg>
  );
}
