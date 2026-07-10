import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { FoodEntry, FoodEntryInput, MealType } from "../types";
import { MEAL_TYPES } from "../types";

interface FoodFormProps {
  date: string;
  editingEntry: FoodEntry | null;
  onSubmit: (input: FoodEntryInput) => Promise<void>;
  onCancelEdit: () => void;
}

interface FormState {
  foodName: string;
  servingSize: string;
  mealType: MealType;
  calories: string;
  protein: string;
  carbs: string;
  saturatedFat: string;
  transFat: string;
  sodium: string;
}

const emptyForm: FormState = {
  foodName: "",
  servingSize: "",
  mealType: "Breakfast",
  calories: "",
  protein: "",
  carbs: "",
  saturatedFat: "",
  transFat: "",
  sodium: ""
};

export default function FoodForm({ date, editingEntry, onSubmit, onCancelEdit }: FoodFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setForm({
        foodName: editingEntry.foodName,
        servingSize: editingEntry.servingSize,
        mealType: editingEntry.mealType,
        calories: String(editingEntry.calories),
        protein: String(editingEntry.protein),
        carbs: String(editingEntry.carbs),
        saturatedFat: String(editingEntry.saturatedFat),
        transFat: String(editingEntry.transFat),
        sodium: String(editingEntry.sodium)
      });
      setError("");
    } else {
      setForm(emptyForm);
    }
  }, [editingEntry]);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.foodName.trim() || !form.servingSize.trim()) {
      setError("Food name and serving size are required.");
      return;
    }

    const numbers = {
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      saturatedFat: Number(form.saturatedFat),
      transFat: Number(form.transFat),
      sodium: Number(form.sodium)
    };

    for (const [key, value] of Object.entries(numbers)) {
      if (form[key as keyof FormState] === "" || Number.isNaN(value) || value < 0) {
        setError("All nutrition values must be zero or greater.");
        return;
      }
    }

    setSaving(true);

    try {
      await onSubmit({
        foodName: form.foodName.trim(),
        servingSize: form.servingSize.trim(),
        mealType: form.mealType,
        ...numbers,
        date
      });
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save food.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="food-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="foodName">Food name</label>
        <input
          id="foodName"
          type="text"
          value={form.foodName}
          maxLength={120}
          placeholder="e.g. Grilled Chicken Breast"
          onChange={(event) => setField("foodName", event.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="servingSize">Serving size</label>
          <input
            id="servingSize"
            type="text"
            value={form.servingSize}
            maxLength={80}
            placeholder="e.g. 6 oz"
            onChange={(event) => setField("servingSize", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="mealType">Meal</label>
          <select
            id="mealType"
            value={form.mealType}
            onChange={(event) => setField("mealType", event.target.value as MealType)}
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal} value={meal}>
                {meal}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="calories">Calories</label>
          <input
            id="calories"
            type="number"
            min="0"
            step="any"
            value={form.calories}
            onChange={(event) => setField("calories", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="protein">Protein (g)</label>
          <input
            id="protein"
            type="number"
            min="0"
            step="any"
            value={form.protein}
            onChange={(event) => setField("protein", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="carbs">Carbs (g)</label>
          <input
            id="carbs"
            type="number"
            min="0"
            step="any"
            value={form.carbs}
            onChange={(event) => setField("carbs", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="saturatedFat">Sat. fat (g)</label>
          <input
            id="saturatedFat"
            type="number"
            min="0"
            step="any"
            value={form.saturatedFat}
            onChange={(event) => setField("saturatedFat", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="transFat">Trans fat (g)</label>
          <input
            id="transFat"
            type="number"
            min="0"
            step="any"
            value={form.transFat}
            onChange={(event) => setField("transFat", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="sodium">Sodium (mg)</label>
          <input
            id="sodium"
            type="number"
            min="0"
            step="any"
            value={form.sodium}
            onChange={(event) => setField("sodium", event.target.value)}
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving…" : editingEntry ? "Update food" : "Add food"}
        </button>
        {editingEntry && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
