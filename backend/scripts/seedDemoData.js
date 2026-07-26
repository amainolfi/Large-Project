/**
 * Build a presentation-ready MacroVanta account without touching real users.
 *
 * Preview only (no database connection):
 *   npm run seed:demo
 *
 * Apply to the database selected by MONGO_URI:
 *   $env:DEMO_PASSWORD="Choose-A-Strong-Password1!"
 *   npm run seed:demo -- --apply
 *
 * Production environments require one additional acknowledgement:
 *   npm run seed:demo -- --apply --allow-production
 *
 * The script owns only demo.macrovanta@example.com. Re-running it refreshes
 * data tied to that account and never deletes records belonging to anyone else.
 */
import "dotenv/config";
import mongoose from "mongoose";
import CardioEntry from "../models/CardioEntry.js";
import FoodEntry from "../models/FoodEntry.js";
import MacroGoal from "../models/MacroGoal.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import SleepEntry from "../models/SleepEntry.js";
import User from "../models/User.js";
import VerificationToken from "../models/VerificationToken.js";
import WaterEntry from "../models/WaterEntry.js";
import WellnessGoal from "../models/WellnessGoal.js";
import { addDays, getTodayDateString } from "../utils/date.js";
import { getPasswordRequirements, hashPassword, isStrongPassword } from "../utils/password.js";

const DEMO_EMAIL = "demo.macrovanta@example.com";
const DAYS = 14;

const nutritionGoal = {
  dailyCalories: 2200,
  dailyProtein: 155,
  dailyCarbs: 250,
  dailyFat: 72,
  dailySaturatedFat: 20,
  dailyTransFat: 2,
  dailyFiber: 30,
  dailySugar: 50,
  dailySodium: 2300,
  dailyPotassium: 3500,
  dailyCalcium: 1000,
  dailyIron: 18,
  dailyVitaminC: 90,
  dailyVitaminD: 20
};

const wellnessGoal = {
  dailyWaterMl: 2500,
  nightlySleepMinutes: 480,
  dailyCardioMinutes: 30
};

const mealTemplates = [
  {
    foodName: "Oatmeal with banana",
    servingSize: "1 bowl",
    mealType: "Breakfast",
    calories: 390,
    protein: 15,
    carbs: 68,
    fat: 9,
    saturatedFat: 1.5,
    transFat: 0,
    fiber: 10,
    sugar: 24,
    sodium: 180,
    potassium: 620,
    calcium: 180,
    iron: 3.2,
    vitaminC: 10,
    vitaminD: 2.5
  },
  {
    foodName: "Greek yogurt and berries",
    servingSize: "1 cup",
    mealType: "Snack",
    calories: 210,
    protein: 22,
    carbs: 28,
    fat: 3,
    saturatedFat: 1.5,
    transFat: 0,
    fiber: 5,
    sugar: 18,
    sodium: 85,
    potassium: 360,
    calcium: 260,
    iron: 0.5,
    vitaminC: 18,
    vitaminD: 1.5
  },
  {
    foodName: "Chicken rice bowl",
    servingSize: "1 bowl",
    mealType: "Lunch",
    calories: 610,
    protein: 52,
    carbs: 68,
    fat: 15,
    saturatedFat: 3,
    transFat: 0,
    fiber: 8,
    sugar: 9,
    sodium: 680,
    potassium: 920,
    calcium: 90,
    iron: 3.5,
    vitaminC: 42,
    vitaminD: 0.4
  },
  {
    foodName: "Salmon with sweet potato",
    servingSize: "1 plate",
    mealType: "Dinner",
    calories: 590,
    protein: 45,
    carbs: 54,
    fat: 22,
    saturatedFat: 4,
    transFat: 0,
    fiber: 9,
    sugar: 14,
    sodium: 310,
    potassium: 1350,
    calcium: 110,
    iron: 2.4,
    vitaminC: 34,
    vitaminD: 16
  }
];

function parseFlags(argv) {
  return new Set(argv.filter((argument) => argument.startsWith("--")));
}

function buildDemoDocuments(userId) {
  const today = getTodayDateString();
  const dates = Array.from({ length: DAYS }, (_value, index) => addDays(today, -index));
  const foods = [];
  const water = [];
  const sleep = [];
  const cardio = [];
  const cardioTypes = ["running", "cycling", "walking", "rowing"];

  for (const [dayIndex, date] of dates.entries()) {
    for (const [mealIndex, template] of mealTemplates.entries()) {
      const adjustment = ((dayIndex + mealIndex) % 3) * 10;
      foods.push({
        ...template,
        userId,
        calories: template.calories + adjustment,
        source: "manual",
        date
      });
    }

    const dailyWater = [500, 500, dayIndex % 3 === 0 ? 750 : 500, 500];
    water.push(...dailyWater.map((amountMl) => ({ userId, amountMl, date })));

    sleep.push({
      userId,
      durationMinutes: 420 + (dayIndex % 5) * 15,
      quality: ["good", "good", "excellent", "fair"][dayIndex % 4],
      notes: dayIndex % 4 === 2 ? "Restful night" : "",
      date
    });

    if (dayIndex % 2 === 0) {
      const durationMinutes = 25 + (dayIndex % 4) * 5;
      cardio.push({
        userId,
        activityType: cardioTypes[(dayIndex / 2) % cardioTypes.length],
        durationMinutes,
        distanceKm: dayIndex % 4 === 0 ? 5 : 0,
        caloriesBurned: durationMinutes * 9,
        intensity: dayIndex % 4 === 0 ? "high" : "moderate",
        notes: "Demo workout",
        date
      });
    }
  }

  return { dates, foods, water, sleep, cardio };
}

async function run() {
  const flags = parseFlags(process.argv.slice(2));
  const apply = flags.has("--apply");
  const allowProduction = flags.has("--allow-production");
  const previewCounts = buildDemoDocuments(new mongoose.Types.ObjectId());

  if (!apply) {
    console.log("Preview only. No database connection was made and no data was changed.");
    console.log(`Reserved demo account: ${DEMO_EMAIL}`);
    console.log(`Days: ${previewCounts.dates.length}`);
    console.log(`Food entries: ${previewCounts.foods.length}`);
    console.log(`Water entries: ${previewCounts.water.length}`);
    console.log(`Sleep entries: ${previewCounts.sleep.length}`);
    console.log(`Cardio entries: ${previewCounts.cardio.length}`);
    console.log("Set DEMO_PASSWORD and add --apply when you are ready to write.");
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required before demo data can be written.");
  }

  if (process.env.NODE_ENV === "production" && !allowProduction) {
    throw new Error(
      "Production write blocked. Re-run with --allow-production after confirming MONGO_URI."
    );
  }

  const password = process.env.DEMO_PASSWORD || "";
  if (!isStrongPassword(password)) {
    throw new Error(`DEMO_PASSWORD is required. ${getPasswordRequirements()}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB database "${mongoose.connection.name}".`);

  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    user = new User({
      firstName: "MacroVanta",
      lastName: "Demo",
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(password),
      isEmailVerified: true
    });
  } else {
    user.firstName = "MacroVanta";
    user.lastName = "Demo";
    user.passwordHash = await hashPassword(password);
    user.isEmailVerified = true;
  }

  await user.save();
  const userId = user._id;

  await Promise.all([
    CardioEntry.deleteMany({ userId }),
    FoodEntry.deleteMany({ userId }),
    MacroGoal.deleteMany({ userId }),
    PasswordResetToken.deleteMany({ userId }),
    SleepEntry.deleteMany({ userId }),
    VerificationToken.deleteMany({ userId }),
    WaterEntry.deleteMany({ userId }),
    WellnessGoal.deleteMany({ userId })
  ]);

  const documents = buildDemoDocuments(userId);
  await Promise.all([
    MacroGoal.create({ userId, ...nutritionGoal }),
    WellnessGoal.create({ userId, ...wellnessGoal }),
    FoodEntry.insertMany(documents.foods, { ordered: true }),
    WaterEntry.insertMany(documents.water, { ordered: true }),
    SleepEntry.insertMany(documents.sleep, { ordered: true }),
    CardioEntry.insertMany(documents.cardio, { ordered: true })
  ]);

  console.log("Demo data refresh complete.");
  console.log(`Account: ${DEMO_EMAIL}`);
  console.log(`Food entries: ${documents.foods.length}`);
  console.log(`Water entries: ${documents.water.length}`);
  console.log(`Sleep entries: ${documents.sleep.length}`);
  console.log(`Cardio entries: ${documents.cardio.length}`);
  console.log("The password was read from DEMO_PASSWORD and was not printed.");
}

run()
  .catch((error) => {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
