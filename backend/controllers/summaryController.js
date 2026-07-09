import FoodEntry from "../models/FoodEntry.js";
import MacroGoal from "../models/MacroGoal.js";
import { addDays, getTodayDateString, isDateString } from "../utils/date.js";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

function emptyTotals() {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
}

function addEntryToTotals(totals, entry) {
  totals.calories += entry.calories;
  totals.protein += entry.protein;
  totals.carbs += entry.carbs;
  totals.fat += entry.fat;
}

function roundOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function formatGoals(goal) {
  return {
    calories: goal?.dailyCalories || 0,
    protein: goal?.dailyProtein || 0,
    carbs: goal?.dailyCarbs || 0,
    fat: goal?.dailyFat || 0
  };
}

function calculateProgress(totals, goals) {
  return {
    calories: goals.calories ? roundOneDecimal((totals.calories / goals.calories) * 100) : 0,
    protein: goals.protein ? roundOneDecimal((totals.protein / goals.protein) * 100) : 0,
    carbs: goals.carbs ? roundOneDecimal((totals.carbs / goals.carbs) * 100) : 0,
    fat: goals.fat ? roundOneDecimal((totals.fat / goals.fat) * 100) : 0
  };
}

function getDateFromQuery(req) {
  const date = req.query.date || getTodayDateString();

  if (!isDateString(date)) {
    return null;
  }

  return date;
}

export async function getDailySummary(req, res) {
  const date = getDateFromQuery(req);

  if (!date) {
    return res.status(400).json({ message: "date must use YYYY-MM-DD format." });
  }

  const [foodEntries, goal] = await Promise.all([
    FoodEntry.find({ userId: req.user._id, date }),
    MacroGoal.findOne({ userId: req.user._id })
  ]);

  const totals = emptyTotals();
  foodEntries.forEach((entry) => addEntryToTotals(totals, entry));

  const goals = formatGoals(goal);

  res.json({
    date,
    totals,
    goals,
    progress: calculateProgress(totals, goals)
  });
}

export async function getSummaryByMeal(req, res) {
  const date = getDateFromQuery(req);

  if (!date) {
    return res.status(400).json({ message: "date must use YYYY-MM-DD format." });
  }

  const foodEntries = await FoodEntry.find({ userId: req.user._id, date });
  const meals = Object.fromEntries(mealTypes.map((mealType) => [mealType, emptyTotals()]));

  foodEntries.forEach((entry) => {
    addEntryToTotals(meals[entry.mealType], entry);
  });

  res.json({ date, meals });
}

export async function getWeeklySummary(req, res) {
  const startDate = req.query.startDate || getTodayDateString();

  if (!isDateString(startDate)) {
    return res.status(400).json({ message: "startDate must use YYYY-MM-DD format." });
  }

  const dates = Array.from({ length: 7 }, (_value, index) => addDays(startDate, index));
  const foodEntries = await FoodEntry.find({
    userId: req.user._id,
    date: { $in: dates }
  });

  const summariesByDate = Object.fromEntries(
    dates.map((date) => [
      date,
      {
        date,
        totals: emptyTotals()
      }
    ])
  );

  foodEntries.forEach((entry) => {
    addEntryToTotals(summariesByDate[entry.date].totals, entry);
  });

  res.json({
    startDate,
    endDate: dates[dates.length - 1],
    days: dates.map((date) => summariesByDate[date])
  });
}
