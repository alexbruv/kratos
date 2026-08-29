interface ConfettiPiece {
  shape: "zigzag" | "dot" | "quarter-circle" | "squiggle";
  color: "red" | "yellow" | "purple" | "blue";
  top: string;
  left?: string;
  right?: string;
  size: number;
  rotate?: number;
}

function Shape({ piece }: { piece: ConfettiPiece }) {
  const color = `var(--color-${piece.color})`;
  const style: React.CSSProperties = {
    position: "absolute",
    top: piece.top,
    left: piece.left,
    right: piece.right,
    width: piece.size,
    height: piece.size,
    transform: piece.rotate ? `rotate(${piece.rotate}deg)` : undefined,
  };

  switch (piece.shape) {
    case "dot":
      return <div style={{ ...style, borderRadius: "9999px", background: color }} />;
    case "quarter-circle":
      return (
        <div
          style={{
            ...style,
            background: color,
            borderRadius: "100% 0 0 0",
          }}
        />
      );
    case "zigzag":
      return (
        <svg style={style} viewBox="0 0 40 16" fill="none">
          <path
            d="M0 14 L8 2 L16 14 L24 2 L32 14 L40 2"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "squiggle":
      return (
        <svg style={style} viewBox="0 0 40 20" fill="none">
          <path
            d="M2 18 C 10 2, 14 2, 20 10 C 26 18, 30 18, 38 2"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

/** Scattered Memphis background accents. Kept sparse — one or two per screen, per the design brief. */
export function MemphisConfetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <Shape key={i} piece={p} />
      ))}
    </div>
  );
}
