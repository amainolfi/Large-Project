import mongoose from "mongoose";
import { z } from "zod";
import FoodEntry from "../models/FoodEntry.js";
import { formatFoodEntry } from "../utils/formatters.js";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

const foodSchema = z.object({
  foodName: z.string().trim().min(1).max(120),
  servingSize: z.string().trim().min(1).max(80),
  mealType: z.enum(mealTypes),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  saturatedFat: z.coerce.number().min(0),
  transFat: z.coerce.number().min(0),
  sodium: z.coerce.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const updateFoodSchema = foodSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

const quickAddSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(mealTypes).optional()
});

function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(" ");
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findOwnedFoodEntry(id, userId) {
  if (!isValidObjectId(id)) {
    return null;
  }

  return FoodEntry.findOne({ _id: id, userId });
}

export async function createFood(req, res) {
  const data = parseBody(foodSchema, req.body);
  const foodEntry = await FoodEntry.create({
    ...data,
    userId: req.user._id
  });

  res.status(201).json({ foodEntry: formatFoodEntry(foodEntry) });
}

export async function getFoods(req, res) {
  const filter = { userId: req.user._id };

  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      return res.status(400).json({ message: "date must use YYYY-MM-DD format." });
    }

    filter.date = req.query.date;
  }

  const foodEntries = await FoodEntry.find(filter).sort({ date: -1, createdAt: -1 });

  res.json({ foodEntries: foodEntries.map(formatFoodEntry) });
}

export async function getFoodById(req, res) {
  const foodEntry = await findOwnedFoodEntry(req.params.id, req.user._id);

  if (!foodEntry) {
    return res.status(404).json({ message: "Food entry not found." });
  }

  res.json({ foodEntry: formatFoodEntry(foodEntry) });
}

export async function updateFood(req, res) {
  const data = parseBody(updateFoodSchema, req.body);
  const foodEntry = await findOwnedFoodEntry(req.params.id, req.user._id);

  if (!foodEntry) {
    return res.status(404).json({ message: "Food entry not found." });
  }

  Object.assign(foodEntry, data);
  await foodEntry.save();

  res.json({ foodEntry: formatFoodEntry(foodEntry) });
}

export async function deleteFood(req, res) {
  const foodEntry = await findOwnedFoodEntry(req.params.id, req.user._id);

  if (!foodEntry) {
    return res.status(404).json({ message: "Food entry not found." });
  }

  await foodEntry.deleteOne();

  res.json({ message: "Food entry deleted successfully." });
}

export async function searchFoods(req, res) {
  const query = String(req.query.query || "").trim();

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  const filter = {
    userId: req.user._id,
    foodName: { $regex: escapeRegex(query), $options: "i" }
  };

  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      return res.status(400).json({ message: "date must use YYYY-MM-DD format." });
    }

    filter.date = req.query.date;
  }

  const foodEntries = await FoodEntry.find(filter).sort({ date: -1, createdAt: -1 }).limit(50);

  res.json({ foodEntries: foodEntries.map(formatFoodEntry) });
}

export async function getRecentFoods(req, res) {
  const recentEntries = await FoodEntry.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const seen = new Set();
  const uniqueEntries = [];

  for (const entry of recentEntries) {
    const key = `${entry.foodName.toLowerCase()}|${entry.servingSize.toLowerCase()}|${entry.calories}|${entry.protein}|${entry.carbs}|${entry.saturatedFat}|${entry.transFat}|${entry.sodium}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueEntries.push(entry);
    }

    if (uniqueEntries.length === 10) {
      break;
    }
  }

  res.json({ foodEntries: uniqueEntries.map(formatFoodEntry) });
}

export async function quickAddFood(req, res) {
  const data = parseBody(quickAddSchema, req.body);
  const sourceEntry = await findOwnedFoodEntry(req.params.id, req.user._id);

  if (!sourceEntry) {
    return res.status(404).json({ message: "Food entry not found." });
  }

  const foodEntry = await FoodEntry.create({
    userId: req.user._id,
    foodName: sourceEntry.foodName,
    servingSize: sourceEntry.servingSize,
    mealType: data.mealType || sourceEntry.mealType,
    calories: sourceEntry.calories,
    protein: sourceEntry.protein,
    carbs: sourceEntry.carbs,
    saturatedFat: sourceEntry.saturatedFat,
    transFat: sourceEntry.transFat,
    sodium: sourceEntry.sodium,
    date: data.date
  });

  res.status(201).json({ foodEntry: formatFoodEntry(foodEntry) });
}
