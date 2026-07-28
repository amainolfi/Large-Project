import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Message from "../components/Message";
import { getGoals, saveGoals } from "../lib/api";
import type { MacroGoalInput } from "../types";

type GoalKey = keyof MacroGoalInput;
type GoalForm = Record<GoalKey, string>;

interface GoalField {
  key: GoalKey;
  label: string;
  unit: string;
  note: string;
}

const defaultForm: GoalForm = {
  dailyCalories: "2000",
  dailyProtein: "150",
  dailyCarbs: "250",
  dailyFat: "70",
  dailySaturatedFat: "20",
  dailyTransFat: "2",
  dailyFiber: "28",
  dailySugar: "50",
  dailySodium: "2300",
  dailyPotassium: "4700",
  dailyCalcium: "1300",
  dailyIron: "18",
  dailyVitaminC: "90",
  dailyVitaminD: "20"
};

const primaryFields: GoalField[] = [
  { key: "dailyCalories", label: "Calories", unit: "kcal", note: "Energy target" },
  { key: "dailyProtein", label: "Protein", unit: "g", note: "Macro target" },
  { key: "dailyCarbs", label: "Carbohydrates", unit: "g", note: "Macro target" },
  { key: "dailyFat", label: "Total fat", unit: "g", note: "Macro target" },
  { key: "dailyFiber", label: "Fiber", unit: "g", note: "Daily target" },
  { key: "dailySugar", label: "Sugar", unit: "g", note: "Daily limit" }
];

const detailFields: GoalField[] = [
  { key: "dailySaturatedFat", label: "Saturated fat", unit: "g", note: "Daily limit" },
  { key: "dailyTransFat", label: "Trans fat", unit: "g", note: "Daily limit" },
  { key: "dailySodium", label: "Sodium", unit: "mg", note: "Daily limit" },
  { key: "dailyPotassium", label: "Potassium", unit: "mg", note: "Daily target" },
  { key: "dailyCalcium", label: "Calcium", unit: "mg", note: "Daily target" },
  { key: "dailyIron", label: "Iron", unit: "mg", note: "Daily target" },
  { key: "dailyVitaminC", label: "Vitamin C", unit: "mg", note: "Daily target" },
  { key: "dailyVitaminD", label: "Vitamin D", unit: "mcg", note: "Daily target" }
];

const allFields = [...primaryFields, ...detailFields];

function GoalInputs({
  fields,
  form,
  onChange
}: {
  fields: GoalField[];
  form: GoalForm;
  onChange: (key: GoalKey, value: string) => void;
}) {
  return (
    <div className="goals-grid">
      {fields.map((field) => (
        <div key={field.key} className="field">
          <label htmlFor={field.key}>
            {field.label} <span className="field-unit">({field.unit})</span>
          </label>
          <input
            id={field.key}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={form[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            required
          />
          <p className="field-hint">{field.note}</p>
        </div>
      ))}
    </div>
  );
}

export default function MacrosPage() {
  const [form, setForm] = useState<GoalForm>(defaultForm);
  const [hasGoals, setHasGoals] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;

    getGoals()
      .then((data) => {
        if (!current || !data.goals) return;

        const loaded = {} as GoalForm;
        for (const field of allFields) {
          loaded[field.key] = String(data.goals[field.key] ?? 0);
        }
        setHasGoals(true);
        setForm(loaded);
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(loadError instanceof Error ? loadError.message : "Could not load macros.");
        }
      });

    return () => {
      current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const values = {} as MacroGoalInput;

    for (const field of allFields) {
      const value = Number(form[field.key]);

      if (!Number.isFinite(value) || value < 0) {
        setError("All macro targets must be numbers that are zero or greater.");
        return;
      }

      values[field.key] = value;
    }

    setSaving(true);

    try {
      await saveGoals(values);
      setHasGoals(true);
      setMessage("Macros saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save macros.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Personal targets</p>
          <h1>Macros</h1>
          <p className="page-subtitle">
            {hasGoals
              ? "Update the targets and limits used on your dashboard."
              : "Set targets and limits to start measuring daily progress."}
          </p>
        </div>
      </div>

      {message && <Message kind="success">{message}</Message>}
      {error && <Message kind="error">{error}</Message>}

      <form onSubmit={handleSubmit}>
        <section className="card goals-card">
          <div className="section-heading">
            <div>
              <h2>Macros, fiber, and sugar</h2>
              <p className="card-note">The main macro and nutrition targets shown on your dashboard.</p>
            </div>
          </div>
          <GoalInputs
            fields={primaryFields}
            form={form}
            onChange={(key, value) => setForm((previous) => ({ ...previous, [key]: value }))}
          />
        </section>

        <section className="card goals-card">
          <div className="section-heading">
            <div>
              <h2>Micronutrients and limits</h2>
              <p className="card-note">Track vitamins, minerals, and fat details alongside macros.</p>
            </div>
          </div>
          <GoalInputs
            fields={detailFields}
            form={form}
            onChange={(key, value) => setForm((previous) => ({ ...previous, [key]: value }))}
          />
        </section>

        <p className="estimate-note goal-disclaimer">
          Suggested starting values are general examples, not personalized medical guidance. Use
          targets recommended by a qualified professional for your needs.
        </p>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving…" : "Save macros"}
        </button>
      </form>
    </Layout>
  );
}
