import { z } from "zod";
import FoodEntry from "../models/FoodEntry.js";
import { parseFoodText } from "../services/aiFoodParser.js";
import { isDateString } from "../utils/date.js";
import { formatFoodEntry } from "../utils/formatters.js";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

const aiLogSchema = z
  .object({
    text: z.string().trim().min(2).max(500),
    date: z.string().refine(isDateString, {
      message: "date must be a valid date in YYYY-MM-DD format."
    }),
    mealType: z.enum(mealTypes).default("Snack")
  })
  .strict();

const blockedPatterns = [
  /https?:\/\//i,
  /```/,
  /\b(ignore|disregard|override)\b.{0,40}\b(instruction|prompt|system|developer)\b/i,
  /\b(system|developer)\s+(message|prompt)\b/i,
  /\b(write|generate|explain|summarize|translate)\b.{0,30}\b(code|essay|story|prompt)\b/i
];

const rejectionMessages = {
  not_food: "Please describe only food or drinks you consumed.",
  ambiguous: "Please include the food and an approximate amount or serving.",
  not_consumed: "Describe what you actually ate or drank, not a recipe or future meal.",
  unsafe_or_instructions: "Only plain food-log descriptions are accepted here."
};

function parseBody(body) {
  const result = aiLogSchema.safeParse(body);

  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
    error.statusCode = 400;
    throw error;
  }

  if (blockedPatterns.some((pattern) => pattern.test(result.data.text))) {
    const error = new Error("Only plain food-log descriptions are accepted here.");
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

export async function logFoodWithAi(req, res) {
  const data = parseBody(req.body);
  const parsed = await parseFoodText({
    text: data.text,
    defaultMealType: data.mealType,
    userId: req.user._id.toString()
  });

  if (!parsed.accepted) {
    return res.status(422).json({
      message:
        rejectionMessages[parsed.rejectionCode] ||
        "Please describe only food or drinks you consumed."
    });
  }

  const documents = parsed.items.map((item) => ({
    ...item,
    userId: req.user._id,
    date: data.date,
    source: "ai"
  }));

  const foodEntries = await FoodEntry.insertMany(documents, {
    ordered: true,
    runValidators: true
  });

  res.status(201).json({
    message: `${foodEntries.length} estimated food ${foodEntries.length === 1 ? "entry" : "entries"} logged.`,
    estimated: true,
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    foodEntries: foodEntries.map(formatFoodEntry)
  });
}
