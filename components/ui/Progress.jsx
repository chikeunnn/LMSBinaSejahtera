import { clampProgress } from '@/lib/utils';

export function ProgressBar({ value, color, height = 6, showLabel = false, animate = true }) {
  const pct = clampProgress(value);
  const fillColor = color ||
    (pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--primary)' : 'var(--warning)');
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>Progress</span><span style={{ fontWeight: 700, color: fillColor }}>{pct}%</span>
        </div>
      )}
      <div className="progress-bar-track" style={{ height }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: fillColor, transition: animate ? 'width 0.6s ease' : 'none' }} />
      </div>
    </div>
  );
}

export function CircularProgress({ value, size = 80, strokeWidth = 7 }) {
  const pct = clampProgress(value);
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const fontSize = size < 70 ? 14 : size < 100 ? 18 : 24;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--surface-2)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--primary)" strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="circular-progress-value" style={{ fontSize, fontWeight: 800 }}>{pct}%</div>
    </div>
  );
}
