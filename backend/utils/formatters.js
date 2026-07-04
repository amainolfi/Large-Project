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
    dailyFat: goal.dailyFat,
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
    calories: foodEntry.calories,
    protein: foodEntry.protein,
    carbs: foodEntry.carbs,
    fat: foodEntry.fat,
    date: foodEntry.date,
    createdAt: foodEntry.createdAt,
    updatedAt: foodEntry.updatedAt
  };
}
