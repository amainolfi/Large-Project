interface MacroProgressProps {
  label: string;
  total: number;
  goal: number;
  percent: number;
  unit: string;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function MacroProgress({
  label,
  total,
  goal,
  percent,
  unit
}: MacroProgressProps) {
  const width = Math.max(0, Math.min(percent, 100));
  const fillClass = `progress-fill${goal > 0 && percent > 100 ? " progress-over" : ""}`;

  return (
    <div className="card macro-card">
      <div className="macro-card-head">
        <span className="macro-label">{label}</span>
        <span className="macro-percent">{goal > 0 ? `${round(percent)}%` : "—"}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={goal > 0 ? goal : undefined}
        aria-valuenow={goal > 0 ? round(total) : undefined}
      >
        <div className={fillClass} style={{ width: `${goal > 0 ? width : 0}%` }} />
      </div>
      <div className="macro-values">
        {round(total)} {unit}
        <span className="macro-goal"> / {goal > 0 ? `${round(goal)} ${unit}` : "no target"}</span>
      </div>
    </div>
  );
}
