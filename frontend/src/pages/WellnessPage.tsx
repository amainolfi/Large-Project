import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Message from "../components/Message";
import {
  createCardioEntry,
  createSleepEntry,
  createWaterEntry,
  deleteCardioEntry,
  deleteSleepEntry,
  deleteWaterEntry,
  getCardioEntries,
  getSleepEntries,
  getWaterEntries,
  getWellnessSummary,
  saveWellnessGoals
} from "../lib/api";
import { addDays, formatDisplayDate, todayString } from "../lib/dates";
import {
  ACTIVITY_TYPES,
  INTENSITY_LEVELS,
  SLEEP_QUALITIES
} from "../types";
import type {
  ActivityType,
  CardioEntry,
  Intensity,
  SleepEntry,
  SleepQuality,
  WaterEntry,
  WellnessSummary
} from "../types";

type WellnessBundle = {
  summary: WellnessSummary;
  waterEntries: WaterEntry[];
  cardioEntries: CardioEntry[];
  sleepEntries: SleepEntry[];
};

type DeleteKind = "water" | "cardio" | "sleep";

async function fetchWellnessBundle(date: string): Promise<WellnessBundle> {
  const [summary, water, cardio, sleep] = await Promise.all([
    getWellnessSummary(date),
    getWaterEntries(date),
    getCardioEntries(date),
    getSleepEntries(date)
  ]);

  return {
    summary,
    waterEntries: water.waterEntries,
    cardioEntries: cardio.cardioEntries,
    sleepEntries: sleep.sleepEntries
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining} min`;
  if (!remaining) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

function ProgressCard({
  label,
  value,
  goal,
  goalText,
  percent
}: {
  label: string;
  value: string;
  goal: number;
  goalText: string;
  percent: number;
}) {
  const hasGoal = goal > 0;
  const width = hasGoal ? Math.min(100, Math.max(0, percent)) : 0;

  return (
    <article className="card macro-card">
      <div className="macro-card-head">
        <span className="macro-label">{label}</span>
        <span className="macro-percent">{hasGoal ? `${Math.round(percent)}%` : "—"}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={hasGoal ? 100 : undefined}
        aria-valuenow={hasGoal ? Math.round(width) : undefined}
      >
        <div
          className={`progress-fill${hasGoal && percent >= 100 ? " progress-complete" : ""}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="macro-values">
        {value}
        <span className="macro-goal"> / {hasGoal ? goalText : "no goal"}</span>
      </div>
    </article>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="empty-note">{children}</p>;
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function WellnessPage() {
  const [date, setDate] = useState(todayString());
  const [summary, setSummary] = useState<WellnessSummary | null>(null);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState("");
  const [waterAmount, setWaterAmount] = useState("500");
  const [cardioForm, setCardioForm] = useState({
    activityType: "running" as ActivityType,
    durationMinutes: "30",
    distanceKm: "0",
    caloriesBurned: "0",
    intensity: "moderate" as Intensity,
    notes: ""
  });
  const [sleepForm, setSleepForm] = useState({
    hours: "8",
    minutes: "0",
    quality: "good" as SleepQuality,
    notes: ""
  });
  const [goalForm, setGoalForm] = useState({
    dailyWaterMl: "2500",
    nightlySleepMinutes: "480",
    dailyCardioMinutes: "30"
  });

  function changeDate(nextDate: string) {
    if (!nextDate) return;

    setError("");
    setMessage("");
    setPendingDelete("");

    if (nextDate === date) return;

    setLoading(true);
    setDate(nextDate);
  }

  function applyBundle(bundle: WellnessBundle, syncGoals: boolean) {
    setSummary(bundle.summary);
    setWaterEntries(bundle.waterEntries);
    setCardioEntries(bundle.cardioEntries);
    setSleepEntries(bundle.sleepEntries);

    if (syncGoals) {
      setGoalForm({
        dailyWaterMl: String(bundle.summary.goals.dailyWaterMl),
        nightlySleepMinutes: String(bundle.summary.goals.nightlySleepMinutes),
        dailyCardioMinutes: String(bundle.summary.goals.dailyCardioMinutes)
      });
    }
  }

  useEffect(() => {
    let current = true;

    fetchWellnessBundle(date)
      .then((bundle) => {
        if (current) applyBundle(bundle, true);
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load wellness data."
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [date]);

  async function refreshAfterMutation() {
    const bundle = await fetchWellnessBundle(date);
    applyBundle(bundle, false);
  }

  async function addWater(amountMl: number) {
    if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > 5000) {
      setError("Water amount must be between 1 and 5,000 mL.");
      return;
    }

    setBusy("water");
    setError("");
    setMessage("");

    try {
      await createWaterEntry({ amountMl, date });
      await refreshAfterMutation();
      setMessage(`${amountMl.toLocaleString()} mL of water added.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not add water.");
    } finally {
      setBusy("");
    }
  }

  function handleWaterSubmit(event: FormEvent) {
    event.preventDefault();
    void addWater(Number(waterAmount));
  }

  async function handleCardioSubmit(event: FormEvent) {
    event.preventDefault();
    const durationMinutes = Number(cardioForm.durationMinutes);
    const distanceKm = Number(cardioForm.distanceKm);
    const caloriesBurned = Number(cardioForm.caloriesBurned);

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      setError("Cardio duration must be a whole number between 1 and 1,440 minutes.");
      return;
    }

    if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 1000) {
      setError("Distance must be between 0 and 1,000 km.");
      return;
    }

    if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0 || caloriesBurned > 10000) {
      setError("Calories burned must be between 0 and 10,000.");
      return;
    }

    setBusy("cardio");
    setError("");
    setMessage("");

    try {
      await createCardioEntry({
        activityType: cardioForm.activityType,
        durationMinutes,
        distanceKm,
        caloriesBurned,
        intensity: cardioForm.intensity,
        notes: cardioForm.notes.trim(),
        date
      });
      await refreshAfterMutation();
      setCardioForm((previous) => ({ ...previous, notes: "" }));
      setMessage("Cardio session logged.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not log cardio.");
    } finally {
      setBusy("");
    }
  }

  async function handleSleepSubmit(event: FormEvent) {
    event.preventDefault();
    const hours = Number(sleepForm.hours);
    const minutes = Number(sleepForm.minutes);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 24 ||
      minutes < 0 ||
      minutes > 59
    ) {
      setError("Enter sleep as 0–24 whole hours and 0–59 whole minutes.");
      return;
    }

    const durationMinutes = hours * 60 + minutes;
    if (durationMinutes < 1 || durationMinutes > 1440) {
      setError("Sleep duration must be between 1 minute and 24 hours.");
      return;
    }

    setBusy("sleep");
    setError("");
    setMessage("");

    try {
      await createSleepEntry({
        durationMinutes,
        quality: sleepForm.quality,
        notes: sleepForm.notes.trim(),
        date
      });
      await refreshAfterMutation();
      setSleepForm((previous) => ({ ...previous, notes: "" }));
      setMessage("Sleep session logged.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not log sleep.");
    } finally {
      setBusy("");
    }
  }

  async function handleGoalsSubmit(event: FormEvent) {
    event.preventDefault();
    const dailyWaterMl = Number(goalForm.dailyWaterMl);
    const nightlySleepMinutes = Number(goalForm.nightlySleepMinutes);
    const dailyCardioMinutes = Number(goalForm.dailyCardioMinutes);

    if (
      !Number.isInteger(dailyWaterMl) ||
      !Number.isInteger(nightlySleepMinutes) ||
      !Number.isInteger(dailyCardioMinutes) ||
      dailyWaterMl < 0 ||
      dailyWaterMl > 20000 ||
      nightlySleepMinutes < 0 ||
      nightlySleepMinutes > 1440 ||
      dailyCardioMinutes < 0 ||
      dailyCardioMinutes > 1440
    ) {
      setError("Wellness goals must be whole numbers within the displayed ranges.");
      return;
    }

    setBusy("goals");
    setError("");
    setMessage("");

    try {
      const response = await saveWellnessGoals({
        dailyWaterMl,
        nightlySleepMinutes,
        dailyCardioMinutes
      });
      await refreshAfterMutation();
      setMessage(response.message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save goals.");
    } finally {
      setBusy("");
    }
  }

  async function removeEntry(kind: DeleteKind, id: string) {
    const key = `${kind}:${id}`;
    setBusy(key);
    setError("");
    setMessage("");

    try {
      if (kind === "water") await deleteWaterEntry(id);
      if (kind === "cardio") await deleteCardioEntry(id);
      if (kind === "sleep") await deleteSleepEntry(id);
      await refreshAfterMutation();
      setPendingDelete("");
      setMessage(`${titleCase(kind)} entry deleted.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not delete entry.");
    } finally {
      setBusy("");
    }
  }

  function deleteButton(kind: DeleteKind, id: string) {
    const key = `${kind}:${id}`;
    const isConfirming = pendingDelete === key;

    return (
      <button
        type="button"
        className="btn btn-danger btn-sm"
        disabled={Boolean(busy)}
        onClick={() => {
          if (isConfirming) {
            void removeEntry(kind, id);
          } else {
            setPendingDelete(key);
          }
        }}
      >
        {busy === key ? "Deleting…" : isConfirming ? "Confirm delete" : "Delete"}
      </button>
    );
  }

  return (
    <Layout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Daily wellness</p>
          <h1>Wellness</h1>
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
          <label className="sr-only" htmlFor="wellness-date">Tracking date</label>
          <input
            id="wellness-date"
            type="date"
            value={date}
            onChange={(event) => changeDate(event.target.value)}
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

      {message && <Message kind="success">{message}</Message>}
      {error && <Message kind="error">{error}</Message>}

      {loading || !summary ? (
        <section className="card wellness-loading" aria-live="polite">
          Loading wellness data…
        </section>
      ) : (
        <>
          <section aria-labelledby="wellness-progress-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">At a glance</p>
                <h2 id="wellness-progress-heading">Wellness progress</h2>
              </div>
            </div>
            <div className="macro-grid wellness-progress-grid">
              <ProgressCard
                label="Hydration"
                value={`${summary.totals.waterMl.toLocaleString()} mL`}
                goal={summary.goals.dailyWaterMl}
                goalText={`${summary.goals.dailyWaterMl.toLocaleString()} mL`}
                percent={summary.progress.waterPercent}
              />
              <ProgressCard
                label="Sleep"
                value={formatDuration(summary.totals.sleepMinutes)}
                goal={summary.goals.nightlySleepMinutes}
                goalText={formatDuration(summary.goals.nightlySleepMinutes)}
                percent={summary.progress.sleepPercent}
              />
              <ProgressCard
                label="Cardio today"
                value={`${summary.totals.cardioMinutes} min`}
                goal={summary.goals.dailyCardioMinutes}
                goalText={`${summary.goals.dailyCardioMinutes} min`}
                percent={summary.progress.cardioPercent}
              />
            </div>
          </section>

          <div className="wellness-grid">
            <section className="card water-card">
              <div className="section-heading">
                <div>
                  <h2>Log water</h2>
                  <p className="card-note">Quick-add a glass or enter an exact amount.</p>
                </div>
                <span className="meal-calories">
                  {countLabel(waterEntries.length, "entry", "entries")}
                </span>
              </div>

              <div className="water-quick-actions" aria-label="Quick-add water">
                {[250, 500, 750].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={Boolean(busy)}
                    onClick={() => void addWater(amount)}
                  >
                    +{amount} mL
                  </button>
                ))}
              </div>

              <form className="inline-submit" onSubmit={handleWaterSubmit}>
                <div className="field inline-field">
                  <label htmlFor="water-amount">Custom amount (mL)</label>
                  <input
                    id="water-amount"
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    value={waterAmount}
                    onChange={(event) => setWaterAmount(event.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn" disabled={Boolean(busy)}>
                  {busy === "water" ? "Adding…" : "Add water"}
                </button>
              </form>

              {waterEntries.length ? (
                <ul className="entry-list wellness-entry-list">
                  {waterEntries.map((entry) => (
                    <li className="entry-row" key={entry.id}>
                      <div className="entry-info">
                        <span className="entry-name">{entry.amountMl.toLocaleString()} mL</span>
                        <span className="entry-serving">Hydration entry</span>
                      </div>
                      <div className="entry-actions">{deleteButton("water", entry.id)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState>No water logged for this day yet.</EmptyState>
              )}
            </section>

            <section className="card sleep-card">
              <div className="section-heading">
                <div>
                  <h2>Log sleep</h2>
                  <p className="card-note">Record overnight sleep or a separate nap.</p>
                </div>
                <span className="meal-calories">{countLabel(sleepEntries.length, "session")}</span>
              </div>

              <form onSubmit={handleSleepSubmit}>
                <div className="wellness-form-grid sleep-form-grid">
                  <div className="field">
                    <label htmlFor="sleep-hours">Hours</label>
                    <input
                      id="sleep-hours"
                      type="number"
                      min="0"
                      max="24"
                      step="1"
                      value={sleepForm.hours}
                      onChange={(event) =>
                        setSleepForm((previous) => ({ ...previous, hours: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="sleep-minutes">Minutes</label>
                    <input
                      id="sleep-minutes"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      value={sleepForm.minutes}
                      onChange={(event) =>
                        setSleepForm((previous) => ({ ...previous, minutes: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="sleep-quality">Quality</label>
                    <select
                      id="sleep-quality"
                      value={sleepForm.quality}
                      onChange={(event) =>
                        setSleepForm((previous) => ({
                          ...previous,
                          quality: event.target.value as SleepQuality
                        }))
                      }
                    >
                      {SLEEP_QUALITIES.map((quality) => (
                        <option key={quality} value={quality}>
                          {titleCase(quality)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="sleep-notes">Notes (optional)</label>
                  <input
                    id="sleep-notes"
                    maxLength={500}
                    placeholder="Late caffeine, nap, woke refreshed…"
                    value={sleepForm.notes}
                    onChange={(event) =>
                      setSleepForm((previous) => ({ ...previous, notes: event.target.value }))
                    }
                  />
                </div>
                <button type="submit" className="btn" disabled={Boolean(busy)}>
                  {busy === "sleep" ? "Saving…" : "Log sleep"}
                </button>
              </form>

              {sleepEntries.length ? (
                <ul className="entry-list wellness-entry-list">
                  {sleepEntries.map((entry) => (
                    <li className="entry-row" key={entry.id}>
                      <div className="entry-info">
                        <span className="entry-name">{formatDuration(entry.durationMinutes)}</span>
                        <span className="entry-serving">
                          {titleCase(entry.quality)} quality
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </span>
                      </div>
                      <div className="entry-actions">{deleteButton("sleep", entry.id)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState>No sleep recorded for this day yet.</EmptyState>
              )}
            </section>
          </div>

          <section className="card cardio-card">
            <div className="section-heading">
              <div>
                <h2>Log cardio</h2>
                <p className="card-note">
                  Duration drives today&apos;s goal; distance and calories are optional.
                </p>
              </div>
              <span className="meal-calories">{countLabel(cardioEntries.length, "session")}</span>
            </div>

            <form onSubmit={handleCardioSubmit}>
              <div className="wellness-form-grid cardio-form-grid">
                <div className="field">
                  <label htmlFor="activity-type">Activity</label>
                  <select
                    id="activity-type"
                    value={cardioForm.activityType}
                    onChange={(event) =>
                      setCardioForm((previous) => ({
                        ...previous,
                        activityType: event.target.value as ActivityType
                      }))
                    }
                  >
                    {ACTIVITY_TYPES.map((activity) => (
                      <option key={activity} value={activity}>
                        {titleCase(activity)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="cardio-duration">Duration (min)</label>
                  <input
                    id="cardio-duration"
                    type="number"
                    min="1"
                    max="1440"
                    step="1"
                    value={cardioForm.durationMinutes}
                    onChange={(event) =>
                      setCardioForm((previous) => ({
                        ...previous,
                        durationMinutes: event.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cardio-distance">Distance (km)</label>
                  <input
                    id="cardio-distance"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={cardioForm.distanceKm}
                    onChange={(event) =>
                      setCardioForm((previous) => ({
                        ...previous,
                        distanceKm: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cardio-calories">Calories burned</label>
                  <input
                    id="cardio-calories"
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    value={cardioForm.caloriesBurned}
                    onChange={(event) =>
                      setCardioForm((previous) => ({
                        ...previous,
                        caloriesBurned: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cardio-intensity">Intensity</label>
                  <select
                    id="cardio-intensity"
                    value={cardioForm.intensity}
                    onChange={(event) =>
                      setCardioForm((previous) => ({
                        ...previous,
                        intensity: event.target.value as Intensity
                      }))
                    }
                  >
                    {INTENSITY_LEVELS.map((intensity) => (
                      <option key={intensity} value={intensity}>
                        {titleCase(intensity)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field cardio-notes-field">
                  <label htmlFor="cardio-notes">Notes (optional)</label>
                  <input
                    id="cardio-notes"
                    maxLength={500}
                    placeholder="Route, workout, or how it felt"
                    value={cardioForm.notes}
                    onChange={(event) =>
                      setCardioForm((previous) => ({ ...previous, notes: event.target.value }))
                    }
                  />
                </div>
              </div>
              <button type="submit" className="btn" disabled={Boolean(busy)}>
                {busy === "cardio" ? "Saving…" : "Log cardio"}
              </button>
            </form>

            {cardioEntries.length ? (
              <ul className="entry-list wellness-entry-list">
                {cardioEntries.map((entry) => (
                  <li className="entry-row" key={entry.id}>
                    <div className="entry-info">
                      <span className="entry-name">
                        {titleCase(entry.activityType)} · {entry.durationMinutes} min
                      </span>
                      <span className="entry-serving">
                        {titleCase(entry.intensity)} intensity
                        {entry.distanceKm ? ` · ${entry.distanceKm} km` : ""}
                        {entry.caloriesBurned ? ` · ${entry.caloriesBurned} kcal` : ""}
                        {entry.notes ? ` · ${entry.notes}` : ""}
                      </span>
                    </div>
                    <div className="entry-actions">{deleteButton("cardio", entry.id)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No cardio recorded for this day yet.</EmptyState>
            )}
          </section>

          <section className="card wellness-goals-card">
            <div className="section-heading">
              <div>
                <h2>Wellness goals</h2>
                <p className="card-note">Set zero to disable a progress target.</p>
              </div>
            </div>
            <form onSubmit={handleGoalsSubmit}>
              <div className="goals-grid wellness-goals-grid">
                <div className="field">
                  <label htmlFor="daily-water-goal">Daily water (mL)</label>
                  <input
                    id="daily-water-goal"
                    type="number"
                    min="0"
                    max="20000"
                    step="1"
                    value={goalForm.dailyWaterMl}
                    onChange={(event) =>
                      setGoalForm((previous) => ({
                        ...previous,
                        dailyWaterMl: event.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="sleep-goal">Nightly sleep (min)</label>
                  <input
                    id="sleep-goal"
                    type="number"
                    min="0"
                    max="1440"
                    step="1"
                    value={goalForm.nightlySleepMinutes}
                    onChange={(event) =>
                      setGoalForm((previous) => ({
                        ...previous,
                        nightlySleepMinutes: event.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cardio-goal">Daily cardio (min)</label>
                  <input
                    id="cardio-goal"
                    type="number"
                    min="0"
                    max="1440"
                    step="1"
                    value={goalForm.dailyCardioMinutes}
                    onChange={(event) =>
                      setGoalForm((previous) => ({
                        ...previous,
                        dailyCardioMinutes: event.target.value
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <p className="estimate-note">
                These are general tracking targets, not medical recommendations.
              </p>
              <button type="submit" className="btn" disabled={Boolean(busy)}>
                {busy === "goals" ? "Saving…" : "Save wellness goals"}
              </button>
            </form>
          </section>
        </>
      )}
    </Layout>
  );
}
