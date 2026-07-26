import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Message from "../components/Message";
import WeeklyMacroChart from "../components/WeeklyMacroChart";
import { getGoals, getWeeklySummary } from "../lib/api";
import { addDays, formatShortDate, todayString } from "../lib/dates";
import type { MacroGoal, NutritionValues, WeeklySummary } from "../types";

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

const columns: { key: keyof NutritionValues; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "saturatedFat", label: "Sat. fat", unit: "g" },
  { key: "transFat", label: "Trans fat", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" }
];

export default function HistoryPage() {
  const [startDate, setStartDate] = useState(addDays(todayString(), -6));
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [goals, setGoals] = useState<MacroGoal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;

    Promise.all([getWeeklySummary(startDate), getGoals()])
      .then(([weekData, goalData]) => {
        if (!current) return;
        setSummary(weekData);
        setGoals(goalData.goals);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(loadError instanceof Error ? loadError.message : "Could not load history.");
        }
      });

    return () => {
      current = false;
    };
  }, [startDate]);

  const calorieGoal = goals?.dailyCalories || 0;
  const maxCalories = Math.max(
    calorieGoal,
    ...(summary?.days.map((day) => day.totals.calories) || [0]),
    1
  );
  // The chart stays chronological (oldest left) so the week reads as a trend,
  // while the table lists the most recent day first.
  const daysNewestFirst = summary ? [...summary.days].reverse() : [];

  return (
    <Layout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Trends</p>
          <h1>Weekly history</h1>
          <p className="page-subtitle">
            {summary ? `${summary.startDate} to ${summary.endDate}` : "Loading…"}
          </p>
        </div>
        <div className="date-controls" aria-label="Choose history week">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setStartDate(addDays(startDate, -7))}>
            ← Prev week
          </button>
          <label className="sr-only" htmlFor="history-start-date">Week start date</label>
          <input
            id="history-start-date"
            type="date"
            value={startDate}
            onChange={(event) => event.target.value && setStartDate(event.target.value)}
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setStartDate(addDays(startDate, 7))}>
            Next week →
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setStartDate(addDays(todayString(), -6))}>
            Last 7 days
          </button>
        </div>
      </div>

      {error && <Message kind="error">{error}</Message>}

      {summary && (
        <>
          <section className="card" aria-labelledby="calorie-chart-heading">
            <h2 id="calorie-chart-heading">Calories by day</h2>
            <div className="week-chart" role="img" aria-label="Seven-day calorie bar chart">
              {summary.days.map((day) => {
                const height = Math.round((day.totals.calories / maxCalories) * 100);
                const over = calorieGoal > 0 && day.totals.calories > calorieGoal;

                return (
                  <div key={day.date} className="week-bar-slot">
                    <span className="week-bar-value">{Math.round(day.totals.calories)}</span>
                    <div className="week-bar-track">
                      <div
                        className={over ? "week-bar week-bar-over" : "week-bar"}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="week-bar-label">{formatShortDate(day.date)}</span>
                  </div>
                );
              })}
            </div>
            {calorieGoal > 0 && (
              <p className="card-note">Daily goal: {calorieGoal} kcal. Red bars are over goal.</p>
            )}
          </section>

          <WeeklyMacroChart days={summary.days} goals={goals} />

          <section className="card" aria-labelledby="daily-totals-heading">
            <div className="section-heading">
              <div>
                <h2 id="daily-totals-heading">Daily nutrition totals</h2>
                <p className="card-note">
                  Most recent day first. Scroll horizontally to compare every tracked nutrient.
                </p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label} ({column.unit})</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysNewestFirst.map((day) => (
                    <tr key={day.date}>
                      <td>{formatShortDate(day.date)}</td>
                      {columns.map((column) => (
                        <td key={column.key}>{round(day.totals[column.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}
