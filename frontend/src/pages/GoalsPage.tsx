import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Message from "../components/Message";
import { getGoals, saveGoals } from "../lib/api";

interface GoalForm {
  dailyCalories: string;
  dailyProtein: string;
  dailyCarbs: string;
  dailySaturatedFat: string;
  dailyTransFat: string;
  dailySodium: string;
}

const defaultForm: GoalForm = {
  dailyCalories: "2000",
  dailyProtein: "150",
  dailyCarbs: "250",
  dailySaturatedFat: "20",
  dailyTransFat: "2",
  dailySodium: "2300"
};

const fields: { key: keyof GoalForm; label: string; unit: string; note: string }[] = [
  { key: "dailyCalories", label: "Calories", unit: "kcal", note: "Daily energy target" },
  { key: "dailyProtein", label: "Protein", unit: "g", note: "Daily target" },
  { key: "dailyCarbs", label: "Carbohydrates", unit: "g", note: "Daily target" },
  { key: "dailySaturatedFat", label: "Saturated fat", unit: "g", note: "Daily limit" },
  { key: "dailyTransFat", label: "Trans fat", unit: "g", note: "Daily limit" },
  { key: "dailySodium", label: "Sodium", unit: "mg", note: "Daily limit" }
];

export default function GoalsPage() {
  const [form, setForm] = useState<GoalForm>(defaultForm);
  const [hasGoals, setHasGoals] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGoals()
      .then((data) => {
        if (data.goals) {
          setHasGoals(true);
          setForm({
            dailyCalories: String(data.goals.dailyCalories),
            dailyProtein: String(data.goals.dailyProtein),
            dailyCarbs: String(data.goals.dailyCarbs),
            dailySaturatedFat: String(data.goals.dailySaturatedFat),
            dailyTransFat: String(data.goals.dailyTransFat),
            dailySodium: String(data.goals.dailySodium)
          });
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load goals.");
      });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, Number(value)])
    );

    if (Object.values(values).some((value) => Number.isNaN(value) || value < 0)) {
      setError("All goals must be numbers that are zero or greater.");
      return;
    }

    setSaving(true);

    try {
      const data = await saveGoals({
        dailyCalories: values.dailyCalories,
        dailyProtein: values.dailyProtein,
        dailyCarbs: values.dailyCarbs,
        dailySaturatedFat: values.dailySaturatedFat,
        dailyTransFat: values.dailyTransFat,
        dailySodium: values.dailySodium
      });
      setHasGoals(true);
      setMessage(data.message);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save goals.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Daily goals</h1>
          <p className="page-subtitle">
            {hasGoals
              ? "Update your daily targets and limits."
              : "Set your daily targets and limits to start tracking progress."}
          </p>
        </div>
      </div>

      {message && <Message kind="success">{message}</Message>}
      {error && <Message kind="error">{error}</Message>}

      <div className="card goals-card">
        <form onSubmit={handleSubmit}>
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
                  value={form[field.key]}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                  required
                />
                <p className="field-hint">{field.note}</p>
              </div>
            ))}
          </div>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Save goals"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
