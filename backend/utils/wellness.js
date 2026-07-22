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
  weeklyCardioMinutes: 150
};

export function getIsoWeekRange(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

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

  return {
    id: goal._id.toString(),
    dailyWaterMl: goal.dailyWaterMl,
    nightlySleepMinutes: goal.nightlySleepMinutes,
    weeklyCardioMinutes: goal.weeklyCardioMinutes,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt
  };
}

export function percentage(total, goal) {
  return goal > 0 ? Math.round((total / goal) * 1000) / 10 : 0;
}
