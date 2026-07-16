import request from "supertest";
import app from "../app.js";

export const STRONG_PASSWORD = "Passw0rd!Test";

let userCounter = 0;

export async function registerVerifiedUser(overrides = {}) {
  userCounter += 1;
  const email = overrides.email || `user${userCounter}@example.com`;

  const registerResponse = await request(app).post("/api/auth/register").send({
    firstName: "Test",
    lastName: "User",
    email,
    password: STRONG_PASSWORD,
    ...overrides
  });

  await request(app).get(`/api/auth/verify-email/${registerResponse.body.developmentToken}`);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email, password: STRONG_PASSWORD });

  return {
    token: loginResponse.body.token,
    user: loginResponse.body.user,
    email
  };
}

export function foodPayload(overrides = {}) {
  return {
    foodName: "Grilled Chicken Breast",
    servingSize: "6 oz",
    mealType: "Lunch",
    calories: 280,
    protein: 52,
    carbs: 0,
    fat: 6,
    saturatedFat: 1.5,
    transFat: 0,
    fiber: 0,
    sodium: 130,
    potassium: 450,
    calcium: 20,
    iron: 1,
    vitaminC: 0,
    vitaminD: 0,
    date: "2026-07-10",
    ...overrides
  };
}

export function goalsPayload(overrides = {}) {
  return {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 250,
    dailyFat: 70,
    dailySaturatedFat: 20,
    dailyTransFat: 2,
    dailyFiber: 28,
    dailySodium: 2300,
    dailyPotassium: 4700,
    dailyCalcium: 1300,
    dailyIron: 18,
    dailyVitaminC: 90,
    dailyVitaminD: 20,
    ...overrides
  };
}
