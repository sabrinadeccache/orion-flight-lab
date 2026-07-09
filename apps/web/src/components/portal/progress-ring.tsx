/**
 * Signature element of the "voo noturno" portal theme: an instrument-dial
 * progress ring (tick marks around the bezel + a swept arc), used
 * everywhere progress is shown — course cards, lesson lists, dashboards —
 * instead of a generic progress bar.
 */
export function ProgressRing({
  percent,
  size = 56,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeWidth = size * 0.09;
  const radius = size / 2 - strokeWidth * 1.6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 100 ? '#3DDAD7' : '#F5A623';
  const ticks = Array.from({ length: 24 });

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {ticks.map((_, index) => {
          const angle = (index / ticks.length) * 360;
          const inner = size / 2 - strokeWidth * 0.9;
          const outer = size / 2 - strokeWidth * 0.3;
          const rad = (angle * Math.PI) / 180;
          const cx = size / 2;
          const cy = size / 2;
          return (
            <line
              key={index}
              x1={cx + inner * Math.cos(rad)}
              y1={cy + inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)}
              y2={cy + outer * Math.sin(rad)}
              stroke="#2A3542"
              strokeWidth={size * 0.012}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1B242F"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <span
        className="absolute font-mono text-portal-text"
        style={{ fontSize: size * 0.22 }}
      >
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
