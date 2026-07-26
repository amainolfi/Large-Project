export const ACTIVITY_TYPES = [
  "walking",
  "running",
  "cycling",
  "swimming",
  "elliptical",
  "rowing",
  "sports",
  "other"
];

export const INTENSITY_LEVELS = ["low", "moderate", "high"];
export const SLEEP_QUALITIES = ["poor", "fair", "good", "excellent"];

export const DEFAULT_WELLNESS_GOALS = {
  dailyWaterMl: 2500,
  nightlySleepMinutes: 480,
  dailyCardioMinutes: 30
};

export function formatCardioEntry(entry) {
  return {
    id: entry._id.toString(),
    activityType: entry.activityType,
    durationMinutes: entry.durationMinutes,
    distanceKm: entry.distanceKm || 0,
    caloriesBurned: entry.caloriesBurned || 0,
    intensity: entry.intensity,
    notes: entry.notes || "",
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

export function formatWaterEntry(entry) {
  return {
    id: entry._id.toString(),
    amountMl: entry.amountMl,
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

export function formatSleepEntry(entry) {
  return {
    id: entry._id.toString(),
    durationMinutes: entry.durationMinutes,
    quality: entry.quality,
    notes: entry.notes || "",
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

export function formatWellnessGoals(goal) {
  if (!goal) {
    return { id: null, ...DEFAULT_WELLNESS_GOALS, createdAt: null, updatedAt: null };
  }

  const dailyCardioMinutes = Number.isFinite(goal.dailyCardioMinutes)
    ? goal.dailyCardioMinutes
    : Number.isFinite(goal.weeklyCardioMinutes)
      ? Math.round(goal.weeklyCardioMinutes / 7)
      : DEFAULT_WELLNESS_GOALS.dailyCardioMinutes;

  return {
    id: goal._id.toString(),
    dailyWaterMl: goal.dailyWaterMl,
    nightlySleepMinutes: goal.nightlySleepMinutes,
    dailyCardioMinutes,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt
  };
}

export function percentage(total, goal) {
  return goal > 0 ? Math.round((total / goal) * 1000) / 10 : 0;
}
