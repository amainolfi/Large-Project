export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

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

export interface FoodEntry {
  id: string;
  foodName: string;
  servingSize: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  saturatedFat: number;
  transFat: number;
  sodium: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntryInput {
  foodName: string;
  servingSize: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  saturatedFat: number;
  transFat: number;
  sodium: number;
  date: string;
}

export interface MacroGoal {
  id: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailySaturatedFat: number;
  dailyTransFat: number;
  dailySodium: number;
  createdAt: string;
  updatedAt: string;
}

export interface MacroGoalInput {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailySaturatedFat: number;
  dailyTransFat: number;
  dailySodium: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  saturatedFat: number;
  transFat: number;
  sodium: number;
}

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
