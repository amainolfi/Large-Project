import { z } from "zod";
import MacroGoal from "../models/MacroGoal.js";
import { formatGoal } from "../utils/formatters.js";

const goalValue = z.coerce.number().finite().min(0).max(1_000_000);
const goalWithDefault = goalValue.default(0);

const goalSchema = z.object({
  dailyCalories: goalValue,
  dailyProtein: goalValue,
  dailyCarbs: goalValue,
  dailyFat: goalWithDefault,
  dailySaturatedFat: goalValue,
  dailyTransFat: goalValue,
  dailyFiber: goalWithDefault,
  dailySodium: goalValue,
  dailyPotassium: goalWithDefault,
  dailyCalcium: goalWithDefault,
  dailyIron: goalWithDefault,
  dailyVitaminC: goalWithDefault,
  dailyVitaminD: goalWithDefault
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

export async function getGoals(req, res) {
  const goals = await MacroGoal.findOne({ userId: req.user._id });

  res.json({ goals: formatGoal(goals) });
}

export async function upsertGoals(req, res) {
  const data = parseBody(goalSchema, req.body);
  const goals = await MacroGoal.findOneAndUpdate(
    { userId: req.user._id },
    { ...data, userId: req.user._id },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({
    message: "Macro goals saved successfully.",
    goals: formatGoal(goals)
  });
}
