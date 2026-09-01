export function Laurel({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 90"
      width="28"
      height="64"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M30 4C18 14 10 28 8 45c-2 17 4 32 14 41" />
      {[10, 22, 34, 46, 58, 70].map((y, i) => (
        <path key={i} d={`M${9 + i * 0.6} ${y} q10 -4 14 -10`} />
      ))}
    </svg>
  );
}
