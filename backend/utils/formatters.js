import { pickNutrition } from "./nutrition.js";

export function formatUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function formatGoal(goal) {
  if (!goal) {
    return null;
  }

  return {
    id: goal._id.toString(),
    dailyCalories: goal.dailyCalories,
    dailyProtein: goal.dailyProtein,
    dailyCarbs: goal.dailyCarbs,
    dailyFat: goal.dailyFat || 0,
    dailySaturatedFat: goal.dailySaturatedFat,
    dailyTransFat: goal.dailyTransFat,
    dailyFiber: goal.dailyFiber || 0,
    dailySodium: goal.dailySodium,
    dailyPotassium: goal.dailyPotassium || 0,
    dailyCalcium: goal.dailyCalcium || 0,
    dailyIron: goal.dailyIron || 0,
    dailyVitaminC: goal.dailyVitaminC || 0,
    dailyVitaminD: goal.dailyVitaminD || 0,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt
  };
}

export function formatFoodEntry(foodEntry) {
  return {
    id: foodEntry._id.toString(),
    foodName: foodEntry.foodName,
    servingSize: foodEntry.servingSize,
    mealType: foodEntry.mealType,
    ...pickNutrition(foodEntry),
    source: foodEntry.source || "manual",
    confidence: foodEntry.confidence || null,
    date: foodEntry.date,
    createdAt: foodEntry.createdAt,
    updatedAt: foodEntry.updatedAt
  };
}
