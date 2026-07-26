export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type FoodSource = "manual" | "ai" | "usda";
export type Confidence = "low" | "medium" | "high";

export const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminD: number;
}

export interface FoodEntry extends NutritionValues {
  id: string;
  foodName: string;
  servingSize: string;
  mealType: MealType;
  source: FoodSource;
  confidence: Confidence | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntryInput extends NutritionValues {
  foodName: string;
  servingSize: string;
  mealType: MealType;
  source?: "manual" | "usda";
  date: string;
}

export interface PresetFood extends NutritionValues {
  fdcId: number;
  foodName: string;
  brand: string | null;
  dataType: string;
  servingSize: string;
}

export interface MacroGoal {
  id: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailySaturatedFat: number;
  dailyTransFat: number;
  dailyFiber: number;
  dailySugar: number;
  dailySodium: number;
  dailyPotassium: number;
  dailyCalcium: number;
  dailyIron: number;
  dailyVitaminC: number;
  dailyVitaminD: number;
  createdAt: string;
  updatedAt: string;
}

export type MacroGoalInput = Omit<MacroGoal, "id" | "createdAt" | "updatedAt">;
export type MacroTotals = NutritionValues;

export interface DailySummary {
  date: string;
  totals: MacroTotals;
  goals: MacroTotals;
  progress: MacroTotals;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  days: { date: string; totals: MacroTotals }[];
}

export interface AiFoodLogResponse {
  message: string;
  estimated: true;
  model: string;
  foodEntries: FoodEntry[];
}

export type ActivityType =
  | "walking"
  | "running"
  | "cycling"
  | "swimming"
  | "elliptical"
  | "rowing"
  | "sports"
  | "other";
export type Intensity = "low" | "moderate" | "high";
export type SleepQuality = "poor" | "fair" | "good" | "excellent";

export const ACTIVITY_TYPES: ActivityType[] = [
  "walking",
  "running",
  "cycling",
  "swimming",
  "elliptical",
  "rowing",
  "sports",
  "other"
];

export const INTENSITY_LEVELS: Intensity[] = ["low", "moderate", "high"];
export const SLEEP_QUALITIES: SleepQuality[] = ["poor", "fair", "good", "excellent"];

export interface CardioEntry {
  id: string;
  activityType: ActivityType;
  durationMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
  intensity: Intensity;
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type CardioEntryInput = Omit<CardioEntry, "id" | "createdAt" | "updatedAt">;

export interface WaterEntry {
  id: string;
  amountMl: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type WaterEntryInput = Pick<WaterEntry, "amountMl" | "date">;

export interface SleepEntry {
  id: string;
  durationMinutes: number;
  quality: SleepQuality;
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type SleepEntryInput = Omit<SleepEntry, "id" | "createdAt" | "updatedAt">;

export interface WellnessGoal {
  id: string | null;
  dailyWaterMl: number;
  nightlySleepMinutes: number;
  dailyCardioMinutes: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type WellnessGoalInput = Pick<
  WellnessGoal,
  "dailyWaterMl" | "nightlySleepMinutes" | "dailyCardioMinutes"
>;

export interface WellnessSummary {
  date: string;
  totals: {
    waterMl: number;
    sleepMinutes: number;
    cardioMinutes: number;
    cardioCaloriesBurned: number;
  };
  goals: WellnessGoal;
  progress: {
    waterPercent: number;
    sleepPercent: number;
    cardioPercent: number;
  };
}
