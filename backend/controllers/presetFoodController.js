import { z } from "zod";

const FDC_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const FDC_DATA_TYPES = "Foundation,SR Legacy,Branded";

// FoodData Central nutrient ids mapped to our nutrition fields, in fallback order.
// Search results report values per 100 g (or 100 ml) of the food.
const NUTRIENT_IDS = {
  calories: [1008, 2047, 2048],
  protein: [1003],
  carbs: [1005, 1050],
  fat: [1004],
  saturatedFat: [1258],
  transFat: [1257],
  sugar: [2000, 1063],
  fiber: [1079],
  sodium: [1093],
  potassium: [1092],
  calcium: [1087],
  iron: [1089],
  vitaminC: [1162],
  vitaminD: [1114, 1110]
};

const GRAM_ML_UNITS = new Set(["g", "grm", "ml", "mlt"]);

// The USDA quota is shared across every user of this server (1,000 requests
// per hour per API key, far fewer on DEMO_KEY), so cap how fast any one user
// can burn through it.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const requestLog = new Map();

function isRateLimited(userId) {
  const now = Date.now();

  if (requestLog.size > 1000) {
    for (const [key, timestamps] of requestLog) {
      if (timestamps.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }

  const recent = (requestLog.get(userId) || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(userId, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(userId, recent);
  return false;
}

const searchSchema = z.object({
  query: z.string().trim().min(1).max(120),
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25)
});

function parseQuery(schema, query) {
  const result = schema.safeParse(query);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(" ");
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

function nutrientValue(foodNutrients, ids) {
  for (const id of ids) {
    const match = foodNutrients.find((nutrient) => nutrient.nutrientId === id);

    if (match && typeof match.value === "number") {
      return match.value;
    }
  }

  return 0;
}

function roundNutrient(value) {
  return Math.max(0, Math.round(value * 10) / 10);
}

function formatPresetFood(food) {
  const foodNutrients = food.foodNutrients || [];
  const nutrients = {};

  for (const [field, ids] of Object.entries(NUTRIENT_IDS)) {
    nutrients[field] = nutrientValue(foodNutrients, ids);
  }

  // Branded foods include a labeled serving size. When it is in grams or
  // milliliters we can scale the per-100 nutrient values to one serving.
  // Otherwise the serving label must stay "100 g" — pairing an unscaled
  // per-100g value with a household label like "1 can" would misstate macros.
  let servingSize = "100 g";
  const unit = String(food.servingSizeUnit || "").trim().toLowerCase();
  const householdText = String(food.householdServingFullText || "").trim();
  const labeledSize = Number(food.servingSize);

  if (Number.isFinite(labeledSize) && labeledSize > 0 && GRAM_ML_UNITS.has(unit)) {
    const factor = labeledSize / 100;

    for (const field of Object.keys(nutrients)) {
      nutrients[field] *= factor;
    }

    const measured = `${Math.round(labeledSize * 10) / 10} ${unit.startsWith("m") ? "ml" : "g"}`;
    servingSize = householdText ? `${householdText} (${measured})` : measured;
  }

  return {
    fdcId: food.fdcId,
    foodName: String(food.description || "").slice(0, 120),
    brand: food.brandName || food.brandOwner || null,
    dataType: food.dataType,
    servingSize: servingSize.slice(0, 80),
    calories: roundNutrient(nutrients.calories),
    protein: roundNutrient(nutrients.protein),
    carbs: roundNutrient(nutrients.carbs),
    fat: roundNutrient(nutrients.fat),
    saturatedFat: roundNutrient(nutrients.saturatedFat),
    transFat: roundNutrient(nutrients.transFat),
    sugar: roundNutrient(nutrients.sugar),
    fiber: roundNutrient(nutrients.fiber),
    sodium: roundNutrient(nutrients.sodium),
    potassium: roundNutrient(nutrients.potassium),
    calcium: roundNutrient(nutrients.calcium),
    iron: roundNutrient(nutrients.iron),
    vitaminC: roundNutrient(nutrients.vitaminC),
    vitaminD: roundNutrient(nutrients.vitaminD)
  };
}

let warnedAboutDemoKey = false;

export async function searchPresetFoods(req, res) {
  const { query, page, pageSize } = parseQuery(searchSchema, req.query);

  if (isRateLimited(req.user._id.toString())) {
    return res
      .status(429)
      .json({ message: "Too many food searches. Please wait a minute and try again." });
  }

  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";

  if (apiKey === "DEMO_KEY" && !warnedAboutDemoKey) {
    warnedAboutDemoKey = true;
    console.warn(
      "USDA_API_KEY is not set. Falling back to DEMO_KEY, which is heavily rate limited — get a free key at https://fdc.nal.usda.gov/api-key-signup.html"
    );
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    dataType: FDC_DATA_TYPES,
    pageNumber: String(page),
    pageSize: String(pageSize)
  });

  let response;

  try {
    response = await fetch(`${FDC_SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    const error = new Error("Could not reach the USDA food database. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  if (response.status === 429) {
    return res
      .status(429)
      .json({ message: "USDA food database rate limit reached. Please try again shortly." });
  }

  if (!response.ok) {
    const error = new Error("The USDA food database returned an error. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    const error = new Error("The USDA food database returned an error. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  const foods = (Array.isArray(data?.foods) ? data.foods : []).map(formatPresetFood);

  res.json({
    foods,
    page: data?.currentPage || page,
    totalPages: data?.totalPages || 0,
    totalResults: data?.totalHits || 0
  });
}
