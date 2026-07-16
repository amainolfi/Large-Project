import { useState } from "react";
import type { FormEvent } from "react";
import { logFoodWithAi } from "../lib/api";
import type { MealType } from "../types";
import { MEAL_TYPES } from "../types";
import Message from "./Message";

export default function AiFoodLogger({
  date,
  onLogged
}: {
  date: string;
  onLogged: () => void;
}) {
  const [text, setText] = useState("");
  const [mealType, setMealType] = useState<MealType>("Lunch");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logging, setLogging] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (text.trim().length < 2) {
      setError("Describe the food or drink you consumed.");
      return;
    }

    setLogging(true);

    try {
      const data = await logFoodWithAi({ text: text.trim(), date, mealType });
      setMessage(`${data.message} Review the estimates below and edit them if needed.`);
      setText("");
      onLogged();
    } catch (logError) {
      setError(logError instanceof Error ? logError.message : "Could not log this meal.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="ai-heading">
        <span className="ai-mark" aria-hidden="true">AI</span>
        <div>
          <h2>Describe what you ate</h2>
          <p className="card-note">Turn a plain-language meal into editable food entries.</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="ai-food-text">Food description</label>
        <textarea
          id="ai-food-text"
          rows={4}
          maxLength={500}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="I had one medium banana and a rice cake for lunch"
          aria-describedby="ai-food-help ai-food-count"
        />
        <div className="field-meta">
          <span id="ai-food-help">Food and drink already consumed only.</span>
          <span id="ai-food-count">{text.length}/500</span>
        </div>
      </div>
      <div className="inline-submit">
        <div className="field inline-field">
          <label htmlFor="ai-meal-type">Default meal</label>
          <select
            id="ai-meal-type"
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal} value={meal}>{meal}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn" disabled={logging || !text.trim()}>
          {logging ? "Estimating…" : "Log with AI"}
        </button>
      </div>
      <p className="estimate-note">
        AI nutrition is an estimate, not medical advice. Verify labels and adjust entries when
        precision matters.
      </p>
      {message && <Message kind="success">{message}</Message>}
      {error && <Message kind="error">{error}</Message>}
    </form>
  );
}
