interface MacroProgressProps {
  label: string;
  total: number;
  goal: number;
  percent: number;
  unit: string;
  kind: "target" | "limit";
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function MacroProgress({
  label,
  total,
  goal,
  percent,
  unit,
  kind
}: MacroProgressProps) {
  const width = Math.min(percent, 100);

  let fillClass = "progress-fill";

  if (kind === "limit" && percent >= 100) {
    fillClass += " progress-over";
  } else if (kind === "limit" && percent >= 85) {
    fillClass += " progress-warn";
  }

  return (
    <div className="card macro-card">
      <div className="macro-card-head">
        <span className="macro-label">{label}</span>
        <span className="macro-percent">{goal > 0 ? `${round(percent)}%` : "—"}</span>
      </div>
      <div className="progress">
        <div className={fillClass} style={{ width: `${goal > 0 ? width : 0}%` }} />
      </div>
      <div className="macro-values">
        {round(total)} {unit}
        <span className="macro-goal"> / {goal > 0 ? `${round(goal)} ${unit}` : "no goal"}</span>
      </div>
    </div>
  );
}
