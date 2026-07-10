import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import Message from "../components/Message";
import { getGoals, getWeeklySummary } from "../lib/api";
import { addDays, formatShortDate, todayString } from "../lib/dates";
import type { MacroGoal, WeeklySummary } from "../types";

export default function HistoryPage() {
  const [startDate, setStartDate] = useState(addDays(todayString(), -6));
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [goals, setGoals] = useState<MacroGoal | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (start: string) => {
    setError("");

    try {
      const [weekData, goalData] = await Promise.all([getWeeklySummary(start), getGoals()]);
      setSummary(weekData);
      setGoals(goalData.goals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load history.");
    }
  }, []);

  useEffect(() => {
    load(startDate);
  }, [startDate, load]);

  const calorieGoal = goals?.dailyCalories || 0;
  const maxCalories = Math.max(
    calorieGoal,
    ...(summary?.days.map((day) => day.totals.calories) || [0]),
    1
  );

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Weekly history</h1>
          <p className="page-subtitle">
            {summary ? `${summary.startDate} to ${summary.endDate}` : "Loading…"}
          </p>
        </div>
        <div className="date-controls">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setStartDate(addDays(startDate, -7))}
          >
            ← Prev week
          </button>
          <input
            type="date"
            value={startDate}
            onChange={(event) => event.target.value && setStartDate(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setStartDate(addDays(startDate, 7))}
          >
            Next week →
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStartDate(addDays(todayString(), -6))}
          >
            Last 7 days
          </button>
        </div>
      </div>

      {error && <Message kind="error">{error}</Message>}

      {summary && (
        <>
          <div className="card">
            <h2>Calories by day</h2>
            <div className="week-chart">
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
          </div>

          <div className="card">
            <h2>Daily totals</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Calories</th>
                    <th>Protein (g)</th>
                    <th>Carbs (g)</th>
                    <th>Sat. fat (g)</th>
                    <th>Trans fat (g)</th>
                    <th>Sodium (mg)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.days.map((day) => (
                    <tr key={day.date}>
                      <td>{formatShortDate(day.date)}</td>
                      <td>{Math.round(day.totals.calories)}</td>
                      <td>{Math.round(day.totals.protein * 10) / 10}</td>
                      <td>{Math.round(day.totals.carbs * 10) / 10}</td>
                      <td>{Math.round(day.totals.saturatedFat * 10) / 10}</td>
                      <td>{Math.round(day.totals.transFat * 10) / 10}</td>
                      <td>{Math.round(day.totals.sodium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
