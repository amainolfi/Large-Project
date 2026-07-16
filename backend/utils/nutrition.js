export const NUTRIENT_FIELDS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "saturatedFat",
  "transFat",
  "fiber",
  "sodium",
  "potassium",
  "calcium",
  "iron",
  "vitaminC",
  "vitaminD"
];

export const GOAL_TO_NUTRIENT = {
  dailyCalories: "calories",
  dailyProtein: "protein",
  dailyCarbs: "carbs",
  dailyFat: "fat",
  dailySaturatedFat: "saturatedFat",
  dailyTransFat: "transFat",
  dailyFiber: "fiber",
  dailySodium: "sodium",
  dailyPotassium: "potassium",
  dailyCalcium: "calcium",
  dailyIron: "iron",
  dailyVitaminC: "vitaminC",
  dailyVitaminD: "vitaminD"
};

export function emptyNutritionTotals() {
  return Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, 0]));
}

export function addNutrition(totals, entry) {
  for (const field of NUTRIENT_FIELDS) {
    totals[field] += Number(entry[field]) || 0;
  }
}

export function pickNutrition(source) {
  return Object.fromEntries(
    NUTRIENT_FIELDS.map((field) => [field, Number(source[field]) || 0])
  );
}
