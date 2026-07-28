import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";
import { formatShortDate } from "../lib/dates";
import type { MacroGoal, WeeklySummary } from "../types";

type MacroKey = "protein" | "carbs" | "fat";
type ChartMode = "share" | "grams";

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
  share: number;
  goal: number | null;
}

const macroDefinitions: {
  key: MacroKey;
  label: string;
  className: string;
  caloriesPerGram: number;
  goalKey: "dailyProtein" | "dailyCarbs" | "dailyFat";
}[] = [
  {
    key: "protein",
    label: "Protein",
    className: "macro-protein",
    caloriesPerGram: 4,
    goalKey: "dailyProtein"
  },
  {
    key: "carbs",
    label: "Carbohydrates",
    className: "macro-carbs",
    caloriesPerGram: 4,
    goalKey: "dailyCarbs"
  },
  {
    key: "fat",
    label: "Fat",
    className: "macro-fat",
    caloriesPerGram: 9,
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

function macroCalorieTotal(day: WeeklySummary["days"][number]): number {
  return macroDefinitions.reduce(
    (total, macro) => total + day.totals[macro.key] * macro.caloriesPerGram,
    0
  );
}

function calorieShare(
  day: WeeklySummary["days"][number],
  macro: (typeof macroDefinitions)[number]
): number {
  const calorieTotal = macroCalorieTotal(day);

  if (calorieTotal <= 0) {
    return 0;
  }

  return (day.totals[macro.key] * macro.caloriesPerGram * 100) / calorieTotal;
}

function goalCalorieShare(
  goals: MacroGoal | null,
  macro: (typeof macroDefinitions)[number]
): number | null {
  if (!goals) {
    return null;
  }

  const goalCalorieTotal = macroDefinitions.reduce(
    (total, definition) =>
      total + goals[definition.goalKey] * definition.caloriesPerGram,
    0
  );

  if (goalCalorieTotal <= 0) {
    return null;
  }

  return (
    (goals[macro.goalKey] * macro.caloriesPerGram * 100) /
    goalCalorieTotal
  );
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
  const [mode, setMode] = useState<ChartMode>("share");
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

  const axisMaximum = mode === "share" ? 100 : gramsMaximum;
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
      share: calorieShare(day, macro),
      goal
    });
  }

  return (
    <section className="card weekly-macro-card" aria-labelledby="macro-chart-heading">
      <div className="macro-chart-heading">
        <div>
          <h2 id="macro-chart-heading">Macros by day</h2>
          <p className="card-note">
            Compare protein, carbohydrates, and fat across tracked days.
          </p>
        </div>
        <div className="macro-mode-toggle" role="group" aria-label="Macro chart display mode">
          <button
            type="button"
            className={mode === "share" ? "active" : ""}
            aria-pressed={mode === "share"}
            onClick={() => setMode("share")}
          >
            Calorie share
          </button>
          <button
            type="button"
            className={mode === "grams" ? "active" : ""}
            aria-pressed={mode === "grams"}
            onClick={() => setMode("grams")}
          >
            Grams
          </button>
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
          aria-label={`Seven-day grouped bar chart showing macros by ${
            mode === "share" ? "calorie share" : "grams"
          }`}
        >
          <div className="macro-axis" aria-hidden="true">
            {scaleValues.map((value) => (
              <span key={value}>
                {formatNumber(value, 0)}
                {mode === "share" ? "%" : " g"}
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
                          const rawValue =
                            mode === "share"
                              ? calorieShare(day, macro)
                              : day.totals[macro.key];
                          const height = Math.min((rawValue / axisMaximum) * 100, 100);
                          const goalValue =
                            mode === "share"
                              ? goalCalorieShare(goals, macro)
                              : goals?.[macro.goalKey] ?? null;
                          const goalPosition =
                            goalValue === null
                              ? null
                              : Math.min((goalValue / axisMaximum) * 100, 100);
                          const overTarget =
                            goalValue !== null && goalValue > 0 && rawValue > goalValue;
                          const accessibleValue =
                            mode === "share"
                              ? `${formatNumber(rawValue)} percent of macro calories`
                              : `${formatNumber(rawValue)} grams`;

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
        {mode === "share"
          ? "Calorie share uses 4 calories per gram of protein or carbohydrates and 9 per gram of fat."
          : "Target markers use your saved daily protein, carbohydrate, and fat targets."}
      </p>

      {tooltip && (
        <div
          className="macro-chart-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.dayLabel}</strong>
          <span>{tooltip.macroLabel}: {formatNumber(tooltip.grams)} g</span>
          <span>Calorie share: {formatNumber(tooltip.share)}%</span>
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
