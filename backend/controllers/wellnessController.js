import mongoose from "mongoose";
import { z } from "zod";
import CardioEntry from "../models/CardioEntry.js";
import SleepEntry from "../models/SleepEntry.js";
import WaterEntry from "../models/WaterEntry.js";
import WellnessGoal from "../models/WellnessGoal.js";
import { getTodayDateString, isDateString } from "../utils/date.js";
import {
  ACTIVITY_TYPES,
  INTENSITY_LEVELS,
  SLEEP_QUALITIES,
  formatCardioEntry,
  formatSleepEntry,
  formatWaterEntry,
  formatWellnessGoals,
  percentage
} from "../utils/wellness.js";

const dateValue = z.string().refine(isDateString, {
  message: "date must be a valid date in YYYY-MM-DD format."
});
const notesValue = z.string().trim().max(500);
const durationValue = z.coerce.number().finite().int().min(1).max(1440);
const distanceValue = z.coerce.number().finite().min(0).max(1000);
const caloriesValue = z.coerce.number().finite().min(0).max(10000);

const cardioCreateSchema = z
  .object({
    activityType: z.enum(ACTIVITY_TYPES),
    durationMinutes: durationValue,
    distanceKm: distanceValue.default(0),
    caloriesBurned: caloriesValue.default(0),
    intensity: z.enum(INTENSITY_LEVELS).default("moderate"),
    notes: notesValue.default(""),
    date: dateValue
  })
  .strict();

const cardioUpdateSchema = z
  .object({
    activityType: z.enum(ACTIVITY_TYPES).optional(),
    durationMinutes: durationValue.optional(),
    distanceKm: distanceValue.optional(),
    caloriesBurned: caloriesValue.optional(),
    intensity: z.enum(INTENSITY_LEVELS).optional(),
    notes: notesValue.optional(),
    date: dateValue.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

const waterCreateSchema = z
  .object({
    amountMl: z.coerce.number().finite().int().min(1).max(5000),
    date: dateValue
  })
  .strict();

const waterUpdateSchema = z
  .object({
    amountMl: z.coerce.number().finite().int().min(1).max(5000).optional(),
    date: dateValue.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

const sleepCreateSchema = z
  .object({
    durationMinutes: durationValue,
    quality: z.enum(SLEEP_QUALITIES).default("good"),
    notes: notesValue.default(""),
    date: dateValue
  })
  .strict();

const sleepUpdateSchema = z
  .object({
    durationMinutes: durationValue.optional(),
    quality: z.enum(SLEEP_QUALITIES).optional(),
    notes: notesValue.optional(),
    date: dateValue.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

const goalsSchema = z
  .object({
    dailyWaterMl: z.coerce.number().finite().int().min(0).max(20000),
    nightlySleepMinutes: z.coerce.number().finite().int().min(0).max(1440),
    dailyCardioMinutes: z.coerce.number().finite().int().min(0).max(1440)
  })
  .strict();

function parse(schema, value) {
  const result = schema.safeParse(value);

  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

function selectedDate(req) {
  return parse(dateValue, String(req.query.date || getTodayDateString()));
}

async function findOwned(model, id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return model.findOne({ _id: id, userId });
}

async function updateOwned({ model, id, userId, data, formatter, responseKey, res }) {
  const entry = await findOwned(model, id, userId);

  if (!entry) {
    return res.status(404).json({ message: "Wellness entry not found." });
  }

  Object.assign(entry, data);
  await entry.save();
  return res.json({ [responseKey]: formatter(entry) });
}

async function deleteOwned({ model, id, userId, res }) {
  const entry = await findOwned(model, id, userId);

  if (!entry) {
    return res.status(404).json({ message: "Wellness entry not found." });
  }

  await entry.deleteOne();
  return res.json({ message: "Wellness entry deleted successfully." });
}

export async function listCardio(req, res) {
  const date = selectedDate(req);
  const entries = await CardioEntry.find({ userId: req.user._id, date }).sort({
    createdAt: -1
  });
  res.json({ cardioEntries: entries.map(formatCardioEntry) });
}

export async function createCardio(req, res) {
  const data = parse(cardioCreateSchema, req.body);
  const entry = await CardioEntry.create({ ...data, userId: req.user._id });
  res.status(201).json({ cardioEntry: formatCardioEntry(entry) });
}

export async function updateCardio(req, res) {
  const data = parse(cardioUpdateSchema, req.body);
  return updateOwned({
    model: CardioEntry,
    id: req.params.id,
    userId: req.user._id,
    data,
    formatter: formatCardioEntry,
    responseKey: "cardioEntry",
    res
  });
}

export async function deleteCardio(req, res) {
  return deleteOwned({
    model: CardioEntry,
    id: req.params.id,
    userId: req.user._id,
    res
  });
}

export async function listWater(req, res) {
  const date = selectedDate(req);
  const entries = await WaterEntry.find({ userId: req.user._id, date }).sort({
    createdAt: -1
  });
  res.json({ waterEntries: entries.map(formatWaterEntry) });
}

export async function createWater(req, res) {
  const data = parse(waterCreateSchema, req.body);
  const entry = await WaterEntry.create({ ...data, userId: req.user._id });
  res.status(201).json({ waterEntry: formatWaterEntry(entry) });
}

export async function updateWater(req, res) {
  const data = parse(waterUpdateSchema, req.body);
  return updateOwned({
    model: WaterEntry,
    id: req.params.id,
    userId: req.user._id,
    data,
    formatter: formatWaterEntry,
    responseKey: "waterEntry",
    res
  });
}

export async function deleteWater(req, res) {
  return deleteOwned({
    model: WaterEntry,
    id: req.params.id,
    userId: req.user._id,
    res
  });
}

export async function listSleep(req, res) {
  const date = selectedDate(req);
  const entries = await SleepEntry.find({ userId: req.user._id, date }).sort({
    createdAt: -1
  });
  res.json({ sleepEntries: entries.map(formatSleepEntry) });
}

export async function createSleep(req, res) {
  const data = parse(sleepCreateSchema, req.body);
  const entry = await SleepEntry.create({ ...data, userId: req.user._id });
  res.status(201).json({ sleepEntry: formatSleepEntry(entry) });
}

export async function updateSleep(req, res) {
  const data = parse(sleepUpdateSchema, req.body);
  return updateOwned({
    model: SleepEntry,
    id: req.params.id,
    userId: req.user._id,
    data,
    formatter: formatSleepEntry,
    responseKey: "sleepEntry",
    res
  });
}

export async function deleteSleep(req, res) {
  return deleteOwned({
    model: SleepEntry,
    id: req.params.id,
    userId: req.user._id,
    res
  });
}

export async function getWellnessGoals(req, res) {
  const goal = await WellnessGoal.findOne({ userId: req.user._id });
  res.json({ goals: formatWellnessGoals(goal) });
}

export async function upsertWellnessGoals(req, res) {
  const data = parse(goalsSchema, req.body);
  const goal = await WellnessGoal.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: { ...data, userId: req.user._id },
      $unset: { weeklyCardioMinutes: "" }
    },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ message: "Wellness goals saved successfully.", goals: formatWellnessGoals(goal) });
}

export async function getWellnessSummary(req, res) {
  const date = selectedDate(req);
  const userId = req.user._id;

  const [waterEntries, sleepEntries, cardioEntries, goal] = await Promise.all([
    WaterEntry.find({ userId, date }),
    SleepEntry.find({ userId, date }),
    CardioEntry.find({ userId, date }),
    WellnessGoal.findOne({ userId })
  ]);

  const goals = formatWellnessGoals(goal);
  const totals = {
    waterMl: waterEntries.reduce((sum, entry) => sum + entry.amountMl, 0),
    sleepMinutes: sleepEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
    cardioMinutes: cardioEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
    cardioCaloriesBurned: cardioEntries.reduce(
      (sum, entry) => sum + entry.caloriesBurned,
      0
    )
  };
  res.json({
    date,
    totals,
    goals,
    progress: {
      waterPercent: percentage(totals.waterMl, goals.dailyWaterMl),
      sleepPercent: percentage(totals.sleepMinutes, goals.nightlySleepMinutes),
      cardioPercent: percentage(totals.cardioMinutes, goals.dailyCardioMinutes)
    }
  });
}
