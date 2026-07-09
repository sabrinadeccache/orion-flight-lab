import Link from 'next/link';
import { ProgressRing } from './progress-ring';

/** Deterministic "night sky" gradient per course — no cover-art upload yet, so
 * every course still gets a distinct, stable poster instead of a flat placeholder. */
function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hueA = hash % 360;
  const hueB = (hueA + 40 + (hash % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 60% 14%), hsl(${hueB} 55% 22%))`;
}

export function CourseCard({
  href,
  code,
  name,
  status,
  percent,
}: {
  href: string;
  code: string;
  name: string;
  status: string;
  percent: number;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-white/5 bg-portal-panel transition hover:border-portal-amber/40 hover:bg-portal-panelHover"
    >
      <div
        className="flex aspect-[16/9] items-end p-4"
        style={{ background: gradientFor(code) }}
      >
        <span className="rounded bg-black/40 px-2 py-1 font-mono text-xs text-portal-text/80">
          {code}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-portal-text group-hover:text-portal-amber">
            {name}
          </h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-portal-muted">{status}</p>
        </div>
        <ProgressRing percent={percent} size={44} />
      </div>
    </Link>
  );
}
