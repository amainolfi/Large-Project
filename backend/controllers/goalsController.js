import { z } from "zod";
import MacroGoal from "../models/MacroGoal.js";
import { formatGoal } from "../utils/formatters.js";

const goalSchema = z.object({
  dailyCalories: z.coerce.number().min(0),
  dailyProtein: z.coerce.number().min(0),
  dailyCarbs: z.coerce.number().min(0),
  dailySaturatedFat: z.coerce.number().min(0),
  dailyTransFat: z.coerce.number().min(0),
  dailySodium: z.coerce.number().min(0)
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
