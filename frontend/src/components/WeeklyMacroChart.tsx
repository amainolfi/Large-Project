import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";
import { formatShortDate } from "../lib/dates";
import type { MacroGoal, WeeklySummary } from "../types";

type MacroKey = "protein" | "carbs" | "fat";

interface WeeklyMacroChartProps {
  days: WeeklySummary["days"];
  goals: MacroGoal | null;
}

interface TooltipState {
  x: number;
  y: number;
  dayLabel: string;
  macroLabel: string;
  grams: number;
  goal: number | null;
}

const macroDefinitions: {
  key: MacroKey;
  label: string;
  className: string;
  goalKey: "dailyProtein" | "dailyCarbs" | "dailyFat";
}[] = [
  {
    key: "protein",
    label: "Protein",
    className: "macro-protein",
    goalKey: "dailyProtein"
  },
  {
    key: "carbs",
    label: "Carbohydrates",
    className: "macro-carbs",
    goalKey: "dailyCarbs"
  },
  {
    key: "fat",
    label: "Fat",
    className: "macro-fat",
    goalKey: "dailyFat"
  }
];

function formatNumber(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
}

function hasMacroData(day: WeeklySummary["days"][number]): boolean {
  return macroDefinitions.some(({ key }) => day.totals[key] > 0);
}

function niceAxisMaximum(value: number): number {
  if (value <= 0) {
    return 100;
  }

  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude * 4;
}

export default function WeeklyMacroChart({ days, goals }: WeeklyMacroChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const trackedDays = useMemo(() => days.filter(hasMacroData), [days]);
  const averages = useMemo(
    () =>
      Object.fromEntries(
        macroDefinitions.map(({ key }) => [
          key,
          trackedDays.length > 0
            ? trackedDays.reduce((total, day) => total + day.totals[key], 0) /
              trackedDays.length
            : 0
        ])
      ) as Record<MacroKey, number>,
    [trackedDays]
  );

  const gramsMaximum = useMemo(() => {
    const dailyValues = days.flatMap((day) =>
      macroDefinitions.map(({ key }) => day.totals[key])
    );
    const goalValues = goals
      ? macroDefinitions.map(({ goalKey }) => goals[goalKey])
      : [];

    return niceAxisMaximum(Math.max(...dailyValues, ...goalValues, 0));
  }, [days, goals]);

  const axisMaximum = gramsMaximum;
  const scaleValues = Array.from(
    { length: 5 },
    (_value, index) => (axisMaximum / 4) * index
  ).reverse();

  function showTooltip(
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    day: WeeklySummary["days"][number],
    macro: (typeof macroDefinitions)[number]
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerEvent = "clientX" in event ? event : null;
    const goal = goals?.[macro.goalKey] ?? null;

    setTooltip({
      x: pointerEvent?.clientX || bounds.left + bounds.width / 2,
      y: pointerEvent?.clientY || bounds.top,
      dayLabel: formatShortDate(day.date),
      macroLabel: macro.label,
      grams: day.totals[macro.key],
      goal
    });
  }

  return (
    <section className="card weekly-macro-card" aria-labelledby="macro-chart-heading">
      <div className="macro-chart-heading">
        <div>
          <h2 id="macro-chart-heading">Macros by day</h2>
          <p className="card-note">
            Compare protein, carbohydrates, and fat in grams across tracked days.
          </p>
        </div>
      </div>

      <div className="macro-average-grid" aria-label={`Daily averages from ${trackedDays.length} tracked days`}>
        {macroDefinitions.map((macro) => {
          const goal = goals?.[macro.goalKey] ?? null;

          return (
            <div key={macro.key} className="macro-average-item">
              <span className={`macro-legend-dot ${macro.className}`} aria-hidden="true" />
              <span>
                <strong>{macro.label}</strong>
                <span>
                  {trackedDays.length > 0
                    ? `${formatNumber(averages[macro.key])} g average`
                    : "No tracked days"}
                  {goal !== null && ` · ${formatNumber(goal)} g target`}
                </span>
              </span>
            </div>
          );
        })}
        <div className="macro-tracked-days">
          {trackedDays.length} of {days.length} days tracked
        </div>
      </div>

      <div className="macro-legend" aria-label="Macro chart legend">
        {macroDefinitions.map((macro) => (
          <span key={macro.key}>
            <span className={`macro-legend-dot ${macro.className}`} aria-hidden="true" />
            {macro.label}
          </span>
        ))}
        <span>
          <span className="macro-legend-dot macro-over" aria-hidden="true" />
          Over target
        </span>
        {goals && (
          <span>
            <span className="macro-goal-legend" aria-hidden="true" />
            Saved target
          </span>
        )}
      </div>

      <div className="weekly-macro-chart-scroll">
        <div
          className="weekly-macro-chart"
          role="group"
          aria-label="Seven-day grouped bar chart showing macros in grams"
        >
          <div className="macro-axis" aria-hidden="true">
            {scaleValues.map((value) => (
              <span key={value}>
                {formatNumber(value, 0)} g
              </span>
            ))}
          </div>

          <div className="macro-plot">
            <div className="macro-gridlines" aria-hidden="true">
              {scaleValues.map((value) => (
                <span key={value} />
              ))}
            </div>

            <div className="macro-day-grid">
              {days.map((day) => {
                const tracked = hasMacroData(day);

                return (
                  <div key={day.date} className="macro-day-column">
                    <div className="macro-bars">
                      {tracked ? (
                        macroDefinitions.map((macro) => {
                          const rawValue = day.totals[macro.key];
                          const height = Math.min((rawValue / axisMaximum) * 100, 100);
                          const goalValue = goals?.[macro.goalKey] ?? null;
                          const goalPosition =
                            goalValue === null
                              ? null
                              : Math.min((goalValue / axisMaximum) * 100, 100);
                          const overTarget =
                            goalValue !== null && goalValue > 0 && rawValue > goalValue;
                          const accessibleValue = `${formatNumber(rawValue)} grams`;

                          return (
                            <div
                              key={macro.key}
                              className="macro-bar-track"
                              role="img"
                              tabIndex={0}
                              aria-label={`${formatShortDate(day.date)}, ${macro.label}: ${accessibleValue}`}
                              onMouseEnter={(event) => showTooltip(event, day, macro)}
                              onMouseMove={(event) => showTooltip(event, day, macro)}
                              onMouseLeave={() => setTooltip(null)}
                              onFocus={(event) => showTooltip(event, day, macro)}
                              onBlur={() => setTooltip(null)}
                            >
                              {goalPosition !== null && (
                                <span
                                  className="macro-goal-marker"
                                  style={{ bottom: `${goalPosition}%` }}
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={`macro-chart-bar ${macro.className}${
                                  overTarget ? " macro-over" : ""
                                }`}
                                style={{ height: `${Math.max(height, 1.5)}%` }}
                                aria-hidden="true"
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="macro-day-empty">
                          <span>No data</span>
                        </div>
                      )}
                    </div>
                    <span className="macro-day-label">{formatShortDate(day.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="macro-chart-note">
        Target markers use your saved daily protein, carbohydrate, and fat targets.
      </p>

      {tooltip && (
        <div
          className="macro-chart-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.dayLabel}</strong>
          <span>{tooltip.macroLabel}: {formatNumber(tooltip.grams)} g</span>
          {tooltip.goal !== null && (
            <span>
              Target: {formatNumber(tooltip.goal)} g
              {tooltip.goal > 0 &&
                ` (${formatNumber((tooltip.grams / tooltip.goal) * 100)}%)`}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
