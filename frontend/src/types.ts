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
