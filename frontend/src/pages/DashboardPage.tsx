import { useCallback, useEffect, useState } from "react";
import FoodForm from "../components/FoodForm";
import Layout from "../components/Layout";
import MacroProgress from "../components/MacroProgress";
import {
  createFood,
  deleteFood,
  getDailySummary,
  getFoods,
  getRecentFoods,
  quickAddFood,
  searchFoods,
  updateFood
} from "../lib/api";
import { addDays, formatDisplayDate, todayString } from "../lib/dates";
import type { DailySummary, FoodEntry, FoodEntryInput } from "../types";
import { MEAL_TYPES } from "../types";

export default function DashboardPage() {
  const [date, setDate] = useState(todayString());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [recent, setRecent] = useState<FoodEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodEntry[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadDay = useCallback(async (targetDate: string) => {
    setPageError("");

    try {
      const [summaryData, foodsData] = await Promise.all([
        getDailySummary(targetDate),
        getFoods(targetDate)
      ]);
      setSummary(summaryData);
      setEntries(foodsData.foodEntries);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load data.");
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const data = await getRecentFoods();
      setRecent(data.foodEntries);
    } catch {
      // Recent foods are non-critical; ignore load errors.
    }
  }, []);

  useEffect(() => {
    loadDay(date);
  }, [date, loadDay]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  async function refresh() {
    await Promise.all([loadDay(date), loadRecent()]);
  }

  // Every keystroke does a round trip to the server.
  async function handleSearchChange(value: string) {
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      setSearchPending(false);
      return;
    }

    setSearchPending(true);

    try {
      const data = await searchFoods(value.trim());
      setSearchResults(data.foodEntries);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchPending(false);
    }
  }

  async function handleFormSubmit(input: FoodEntryInput) {
    if (editingEntry) {
      await updateFood(editingEntry.id, input);
      setEditingEntry(null);
    } else {
      await createFood(input);
    }

    await refresh();
  }

  async function handleDelete(entry: FoodEntry) {
    const confirmed = window.confirm(`Delete "${entry.foodName}" from ${entry.mealType}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteFood(entry.id);

      if (editingEntry?.id === entry.id) {
        setEditingEntry(null);
      }

      await refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete entry.");
    }
  }

  async function handleQuickAdd(entry: FoodEntry) {
    setPageError("");

    try {
      await quickAddFood(entry.id, date);
      await refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not add entry.");
    }
  }

  const totals = summary?.totals;
  const goals = summary?.goals;
  const progress = summary?.progress;

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">{formatDisplayDate(date)}</p>
        </div>
        <div className="date-controls">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setDate(addDays(date, -1))}
          >
            ← Prev
          </button>
          <input
            type="date"
            value={date}
            onChange={(event) => event.target.value && setDate(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setDate(addDays(date, 1))}
          >
            Next →
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setDate(todayString())}>
            Today
          </button>
        </div>
      </div>

      {pageError && <div className="message message-error">{pageError}</div>}

      {totals && goals && progress && (
        <section className="macro-grid">
          <MacroProgress
            label="Calories"
            total={totals.calories}
            goal={goals.calories}
            percent={progress.calories}
            unit="kcal"
            kind="target"
          />
          <MacroProgress
            label="Protein"
            total={totals.protein}
            goal={goals.protein}
            percent={progress.protein}
            unit="g"
            kind="target"
          />
          <MacroProgress
            label="Carbs"
            total={totals.carbs}
            goal={goals.carbs}
            percent={progress.carbs}
            unit="g"
            kind="target"
          />
          <MacroProgress
            label="Saturated fat"
            total={totals.saturatedFat}
            goal={goals.saturatedFat}
            percent={progress.saturatedFat}
            unit="g"
            kind="limit"
          />
          <MacroProgress
            label="Trans fat"
            total={totals.transFat}
            goal={goals.transFat}
            percent={progress.transFat}
            unit="g"
            kind="limit"
          />
          <MacroProgress
            label="Sodium"
            total={totals.sodium}
            goal={goals.sodium}
            percent={progress.sodium}
            unit="mg"
            kind="limit"
          />
        </section>
      )}

      <div className="dashboard-columns">
        <section className="meal-column">
          {MEAL_TYPES.map((meal) => {
            const mealEntries = entries.filter((entry) => entry.mealType === meal);
            const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);

            return (
              <div key={meal} className="card meal-card">
                <div className="meal-head">
                  <h2>{meal}</h2>
                  <span className="meal-calories">{Math.round(mealCalories)} kcal</span>
                </div>
                {mealEntries.length === 0 ? (
                  <p className="empty-note">Nothing logged yet.</p>
                ) : (
                  <ul className="entry-list">
                    {mealEntries.map((entry) => (
                      <li key={entry.id} className="entry-row">
                        <div className="entry-info">
                          <span className="entry-name">{entry.foodName}</span>
                          <span className="entry-serving">{entry.servingSize}</span>
                          <span className="entry-macros">
                            {entry.calories} kcal · P {entry.protein}g · C {entry.carbs}g · SF{" "}
                            {entry.saturatedFat}g · TF {entry.transFat}g · Na {entry.sodium}mg
                          </span>
                        </div>
                        <div className="entry-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingEntry(entry)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(entry)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        <aside className="side-column">
          <div className="card">
            <h2>{editingEntry ? "Edit food" : "Add food"}</h2>
            <FoodForm
              date={date}
              editingEntry={editingEntry}
              onSubmit={handleFormSubmit}
              onCancelEdit={() => setEditingEntry(null)}
            />
          </div>

          <div className="card">
            <h2>Search your foods</h2>
            <p className="card-note">Search past entries and re-log them for this day.</p>
            <div className="field">
              <input
                type="text"
                placeholder="Start typing to search…"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>
            {searchPending && <p className="empty-note">Searching…</p>}
            {!searchPending && searchQuery.trim() && searchResults.length === 0 && (
              <p className="empty-note">No matches found.</p>
            )}
            <ul className="result-list">
              {searchResults.slice(0, 8).map((entry) => (
                <li key={entry.id} className="result-row">
                  <div className="entry-info">
                    <span className="entry-name">{entry.foodName}</span>
                    <span className="entry-serving">
                      {entry.servingSize} · {entry.calories} kcal
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleQuickAdd(entry)}
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Recent foods</h2>
            <p className="card-note">One tap to log something you have eaten before.</p>
            {recent.length === 0 ? (
              <p className="empty-note">Foods you log will show up here.</p>
            ) : (
              <ul className="result-list">
                {recent.map((entry) => (
                  <li key={entry.id} className="result-row">
                    <div className="entry-info">
                      <span className="entry-name">{entry.foodName}</span>
                      <span className="entry-serving">
                        {entry.servingSize} · {entry.calories} kcal
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleQuickAdd(entry)}
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
