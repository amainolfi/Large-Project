import { useState } from "react";
import type { FormEvent } from "react";
import type { FoodEntry, FoodEntryInput, MealType, NutritionValues } from "../types";
import { MEAL_TYPES } from "../types";

interface FoodFormProps {
  date: string;
  editingEntry: FoodEntry | null;
  onSubmit: (input: FoodEntryInput) => Promise<void>;
  onCancelEdit: () => void;
}

type NumericField = keyof NutritionValues;

interface FormState extends Record<NumericField, string> {
  foodName: string;
  servingSize: string;
  mealType: MealType;
}

const primaryFields: { key: NumericField; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbohydrates", unit: "g" },
  { key: "fat", label: "Total fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" }
];

const micronutrientFields: { key: NumericField; label: string; unit: string }[] = [
  { key: "saturatedFat", label: "Saturated fat", unit: "g" },
  { key: "transFat", label: "Trans fat", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" }
];

const nutritionKeys: NumericField[] = [
  ...primaryFields.map((field) => field.key),
  ...micronutrientFields.map((field) => field.key)
];

function makeInitialForm(entry: FoodEntry | null): FormState {
  const form = {
    foodName: entry?.foodName || "",
    servingSize: entry?.servingSize || "",
    mealType: entry?.mealType || "Breakfast"
  } as FormState;

  for (const key of nutritionKeys) {
    form[key] = String(entry?.[key] ?? 0);
  }

  return form;
}

function NutritionField({
  field,
  value,
  onChange
}: {
  field: { key: NumericField; label: string; unit: string };
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={`food-${field.key}`}>
        {field.label} <span className="field-unit">({field.unit})</span>
      </label>
      <input
        id={`food-${field.key}`}
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}

export default function FoodForm({ date, editingEntry, onSubmit, onCancelEdit }: FoodFormProps) {
  const [form, setForm] = useState<FormState>(() => makeInitialForm(editingEntry));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

    const nutrition = {} as NutritionValues;

    for (const key of nutritionKeys) {
      const value = Number(form[key]);

      if (form[key] === "" || !Number.isFinite(value) || value < 0) {
        setError("All nutrition values must be numbers that are zero or greater.");
        return;
      }

      nutrition[key] = value;
    }

    setSaving(true);

    try {
      await onSubmit({
        foodName: form.foodName.trim(),
        servingSize: form.servingSize.trim(),
        mealType: form.mealType,
        ...nutrition,
        date
      });

      if (!editingEntry) {
        setForm(makeInitialForm(null));
      }
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
          placeholder="e.g. Grilled chicken breast"
          onChange={(event) => setField("foodName", event.target.value)}
          required
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
            required
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

      <div className="nutrition-form-grid">
        {primaryFields.map((field) => (
          <NutritionField
            key={field.key}
            field={field}
            value={form[field.key]}
            onChange={(value) => setField(field.key, value)}
          />
        ))}
      </div>

      <details className="nutrition-details" open={Boolean(editingEntry)}>
        <summary>Micronutrients and fat details</summary>
        <div className="nutrition-form-grid nutrition-form-grid-wide">
          {micronutrientFields.map((field) => (
            <NutritionField
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={(value) => setField(field.key, value)}
            />
          ))}
        </div>
      </details>

      {error && <p className="form-error" role="alert">{error}</p>}
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
