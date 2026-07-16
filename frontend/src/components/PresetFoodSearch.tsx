import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createFood, searchPresetFoods } from "../lib/api";
import type { MealType, PresetFood } from "../types";
import { MEAL_TYPES } from "../types";
import Message from "./Message";

export default function PresetFoodSearch({
  date,
  onAdded
}: {
  date: string;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [mealType, setMealType] = useState<MealType>("Lunch");
  const [results, setResults] = useState<PresetFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const requestId = useRef(0);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a food to search.");
      return;
    }

    const currentRequest = ++requestId.current;
    setSearching(true);
    setError("");
    setMessage("");

    try {
      const data = await searchPresetFoods(trimmed);

      if (currentRequest === requestId.current) {
        setResults(data.foods);
      }
    } catch (searchError) {
      if (currentRequest === requestId.current) {
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : "Food search failed.");
      }
    } finally {
      if (currentRequest === requestId.current) {
        setSearching(false);
      }
    }
  }

  async function addPreset(food: PresetFood) {
    setAddingId(food.fdcId);
    setError("");
    setMessage("");

    try {
      const { fdcId: _fdcId, brand: _brand, dataType: _dataType, ...nutrition } = food;
      void _fdcId;
      void _brand;
      void _dataType;
      await createFood({ ...nutrition, mealType, date, source: "usda" });
      setMessage(`${food.foodName} added to ${mealType}.`);
      onAdded();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add this food.");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <h2>Search verified food data</h2>
      <p className="card-note">Search USDA FoodData Central and add a serving to this day.</p>
      <form className="search-form" onSubmit={handleSearch}>
        <div className="field search-field">
          <label htmlFor="preset-search">Food or brand</label>
          <input
            id="preset-search"
            type="search"
            value={query}
            maxLength={80}
            placeholder="e.g. Greek yogurt"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field search-meal">
          <label htmlFor="preset-meal">Meal</label>
          <select
            id="preset-meal"
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal} value={meal}>{meal}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-outline" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>
      {message && <Message kind="success">{message}</Message>}
      {error && <Message kind="error">{error}</Message>}
      {!searching && query.trim() && !error && results.length === 0 && (
        <p className="empty-note">No USDA matches yet. Run a search above.</p>
      )}
      <ul className="result-list preset-results">
        {results.map((food) => (
          <li key={food.fdcId} className="result-row">
            <div className="entry-info">
              <span className="entry-name">{food.foodName}</span>
              <span className="entry-serving">
                {food.brand ? `${food.brand} · ` : ""}{food.servingSize} · {food.calories} kcal
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => addPreset(food)}
              disabled={addingId !== null}
            >
              {addingId === food.fdcId ? "Adding…" : "+ Add"}
            </button>
          </li>
        ))}
      </ul>
      <p className="data-credit">Nutrition source: USDA FoodData Central.</p>
    </div>
  );
}
