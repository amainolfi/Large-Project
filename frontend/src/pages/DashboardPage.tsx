import { useEffect, useRef, useState } from "react";
import AiFoodLogger from "../components/AiFoodLogger";
import FoodForm from "../components/FoodForm";
import Layout from "../components/Layout";
import MacroProgress from "../components/MacroProgress";
import Message from "../components/Message";
import PresetFoodSearch from "../components/PresetFoodSearch";
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

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayString());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [recent, setRecent] = useState<FoodEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodEntry[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [pageError, setPageError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const latestSearch = useRef(0);

  useEffect(() => {
    let current = true;

    Promise.all([getDailySummary(date), getFoods(date), getRecentFoods()])
      .then(([summaryData, foodsData, recentData]) => {
        if (!current) return;
        setSummary(summaryData);
        setEntries(foodsData.foodEntries);
        setRecent(recentData.foodEntries);
        setPageError("");
      })
      .catch((error: unknown) => {
        if (current) {
          setPageError(error instanceof Error ? error.message : "Could not load dashboard data.");
        }
      });

    return () => {
      current = false;
    };
  }, [date, refreshVersion]);

  function refresh() {
    setRefreshVersion((version) => version + 1);
  }

  function changeDate(nextDate: string) {
    setEditingEntry(null);
    setDate(nextDate);
  }

  // This deliberately round-trips to the Express search endpoint for every non-empty query.
  async function handleSearchChange(value: string) {
    const requestNumber = ++latestSearch.current;
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      setSearchPending(false);
      return;
    }

    setSearchPending(true);

    try {
      const data = await searchFoods(value.trim());

      if (requestNumber === latestSearch.current) {
        setSearchResults(data.foodEntries);
      }
    } catch {
      if (requestNumber === latestSearch.current) {
        setSearchResults([]);
      }
    } finally {
      if (requestNumber === latestSearch.current) {
        setSearchPending(false);
      }
    }
  }

  async function handleFormSubmit(input: FoodEntryInput) {
    if (editingEntry) {
      await updateFood(editingEntry.id, input);
      setEditingEntry(null);
    } else {
      await createFood(input);
    }

    refresh();
  }

  async function handleDelete(entry: FoodEntry) {
    setPageError("");
    setDeletingEntryId(entry.id);

    try {
      await deleteFood(entry.id);

      if (editingEntry?.id === entry.id) {
        setEditingEntry(null);
      }

      refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not delete entry.");
    } finally {
      setDeletingEntryId("");
    }
  }

  async function handleQuickAdd(entry: FoodEntry) {
    setPageError("");

    try {
      await quickAddFood(entry.id, date);
      refresh();
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
          <p className="eyebrow">Daily nutrition</p>
          <h1>Dashboard</h1>
          <p className="page-subtitle">{formatDisplayDate(date)}</p>
        </div>
        <div className="date-controls" aria-label="Choose tracking date">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => changeDate(addDays(date, -1))}
          >
            ← Prev
          </button>
          <label className="sr-only" htmlFor="dashboard-date">Tracking date</label>
          <input
            id="dashboard-date"
            type="date"
            value={date}
            onChange={(event) => event.target.value && changeDate(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => changeDate(addDays(date, 1))}
          >
            Next →
          </button>
          <button type="button" className="btn btn-sm" onClick={() => changeDate(todayString())}>
            Today
          </button>
        </div>
      </div>

      {pageError && <Message kind="error">{pageError}</Message>}

      {totals && goals && progress && (
        <>
          <section aria-labelledby="macro-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">At a glance</p>
                <h2 id="macro-heading">Macros, fiber, and sugar</h2>
              </div>
            </div>
            <div className="macro-grid">
              <MacroProgress label="Calories" total={totals.calories} goal={goals.calories} percent={progress.calories} unit="kcal" kind="target" />
              <MacroProgress label="Protein" total={totals.protein} goal={goals.protein} percent={progress.protein} unit="g" kind="target" />
              <MacroProgress label="Carbohydrates" total={totals.carbs} goal={goals.carbs} percent={progress.carbs} unit="g" kind="target" />
              <MacroProgress label="Total fat" total={totals.fat} goal={goals.fat} percent={progress.fat} unit="g" kind="target" />
              <MacroProgress label="Fiber" total={totals.fiber} goal={goals.fiber} percent={progress.fiber} unit="g" kind="target" />
              <MacroProgress label="Sugar" total={totals.sugar} goal={goals.sugar} percent={progress.sugar} unit="g" kind="limit" />
            </div>
          </section>

          <details className="card nutrient-overview">
            <summary>Micronutrients and daily limits</summary>
            <div className="macro-grid nutrient-grid">
              <MacroProgress label="Saturated fat" total={totals.saturatedFat} goal={goals.saturatedFat} percent={progress.saturatedFat} unit="g" kind="limit" />
              <MacroProgress label="Trans fat" total={totals.transFat} goal={goals.transFat} percent={progress.transFat} unit="g" kind="limit" />
              <MacroProgress label="Sodium" total={totals.sodium} goal={goals.sodium} percent={progress.sodium} unit="mg" kind="limit" />
              <MacroProgress label="Potassium" total={totals.potassium} goal={goals.potassium} percent={progress.potassium} unit="mg" kind="target" />
              <MacroProgress label="Calcium" total={totals.calcium} goal={goals.calcium} percent={progress.calcium} unit="mg" kind="target" />
              <MacroProgress label="Iron" total={totals.iron} goal={goals.iron} percent={progress.iron} unit="mg" kind="target" />
              <MacroProgress label="Vitamin C" total={totals.vitaminC} goal={goals.vitaminC} percent={progress.vitaminC} unit="mg" kind="target" />
              <MacroProgress label="Vitamin D" total={totals.vitaminD} goal={goals.vitaminD} percent={progress.vitaminD} unit="mcg" kind="target" />
            </div>
          </details>
        </>
      )}

      <section className="card ai-card" aria-label="AI-assisted food logging">
        <AiFoodLogger date={date} onLogged={refresh} />
      </section>

      <section className="card preset-card" aria-label="USDA food search">
        <PresetFoodSearch date={date} onAdded={refresh} />
      </section>

      <div className="dashboard-columns">
        <section className="meal-column" aria-label="Food entries by meal">
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
                          <div className="entry-title-line">
                            <span className="entry-name">{entry.foodName}</span>
                            {entry.source !== "manual" && (
                              <span className={`source-badge source-${entry.source}`}>
                                {entry.source === "ai" ? "AI estimate" : "USDA"}
                              </span>
                            )}
                          </div>
                          <span className="entry-serving">{entry.servingSize}</span>
                          <span className="entry-macros">
                            {round(entry.calories)} kcal · P {round(entry.protein)}g · C {round(entry.carbs)}g · F {round(entry.fat)}g · Fiber {round(entry.fiber)}g · Sugar {round(entry.sugar)}g
                          </span>
                          <details className="entry-nutrients">
                            <summary>Micronutrients</summary>
                            <span>
                              Sat. fat {round(entry.saturatedFat)}g · Trans fat {round(entry.transFat)}g · Sodium {round(entry.sodium)}mg · Potassium {round(entry.potassium)}mg · Calcium {round(entry.calcium)}mg · Iron {round(entry.iron)}mg · Vitamin C {round(entry.vitaminC)}mg · Vitamin D {round(entry.vitaminD)}mcg
                            </span>
                          </details>
                        </div>
                        <div className="entry-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingEntry(entry);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={deletingEntryId === entry.id}
                            onClick={() => void handleDelete(entry)}
                          >
                            {deletingEntryId === entry.id ? "Deleting…" : "Delete"}
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
            <h2>{editingEntry ? "Review and edit food" : "Log food manually"}</h2>
            <p className="card-note">
              {editingEntry
                ? "Correct any serving or nutrition estimate before saving."
                : "Enter label values or your best-known serving details."}
            </p>
            <FoodForm
              key={editingEntry?.id || "new-food"}
              date={date}
              editingEntry={editingEntry}
              onSubmit={handleFormSubmit}
              onCancelEdit={() => setEditingEntry(null)}
            />
          </div>

          <div className="card">
            <h2>Search your foods</h2>
            <p className="card-note">Search past entries on the server and re-log one today.</p>
            <div className="field">
              <label className="sr-only" htmlFor="food-history-search">Search your previous foods</label>
              <input
                id="food-history-search"
                type="search"
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
                    <span className="entry-serving">{entry.servingSize} · {entry.calories} kcal</span>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickAdd(entry)}>
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
                      <span className="entry-serving">{entry.servingSize} · {entry.calories} kcal</span>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickAdd(entry)}>
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
