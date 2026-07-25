import request from "supertest";
import app from "../../app.js";
import { foodPayload, goalsPayload, registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const DATE = "2026-07-10";

async function seedUserWithDay() {
  const { token } = await registerVerifiedUser();

  await request(app)
    .put("/api/goals")
    .set("Authorization", `Bearer ${token}`)
    .send(goalsPayload());

  await request(app)
    .post("/api/foods")
    .set("Authorization", `Bearer ${token}`)
    .send(
      foodPayload({
        foodName: "Eggs",
        mealType: "Breakfast",
        calories: 300,
        protein: 18,
        carbs: 2,
        fat: 20,
        saturatedFat: 3,
        transFat: 0.5,
        fiber: 1,
        sugar: 1,
        sodium: 200,
        potassium: 300,
        calcium: 40,
        iron: 2,
        vitaminC: 1,
        vitaminD: 2,
        date: DATE
      })
    );

  await request(app)
    .post("/api/foods")
    .set("Authorization", `Bearer ${token}`)
    .send(
      foodPayload({
        foodName: "Chicken Bowl",
        mealType: "Lunch",
        calories: 500,
        protein: 40,
        carbs: 55,
        fat: 15,
        saturatedFat: 4.5,
        transFat: 0,
        fiber: 8,
        sugar: 9,
        sodium: 800,
        potassium: 700,
        calcium: 80,
        iron: 3,
        vitaminC: 12,
        vitaminD: 0,
        date: DATE
      })
    );

  return token;
}

describe("GET /api/summary/daily", () => {
  test("sums totals and computes progress percentages", async () => {
    const token = await seedUserWithDay();

    const response = await request(app)
      .get(`/api/summary/daily?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.date).toBe(DATE);
    expect(response.body.totals).toEqual({
      calories: 800,
      protein: 58,
      carbs: 57,
      fat: 35,
      saturatedFat: 7.5,
      transFat: 0.5,
      fiber: 9,
      sugar: 10,
      sodium: 1000,
      potassium: 1000,
      calcium: 120,
      iron: 5,
      vitaminC: 13,
      vitaminD: 2
    });
    expect(response.body.goals).toEqual({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70,
      saturatedFat: 20,
      transFat: 2,
      fiber: 28,
      sugar: 50,
      sodium: 2300,
      potassium: 4700,
      calcium: 1300,
      iron: 18,
      vitaminC: 90,
      vitaminD: 20
    });
    expect(response.body.progress).toEqual({
      calories: 40,
      protein: 38.7,
      carbs: 22.8,
      fat: 50,
      saturatedFat: 37.5,
      transFat: 25,
      fiber: 32.1,
      sugar: 20,
      sodium: 43.5,
      potassium: 21.3,
      calcium: 9.2,
      iron: 27.8,
      vitaminC: 14.4,
      vitaminD: 10
    });
  });

  test("returns zero progress when no goals are set", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get(`/api/summary/daily?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.progress).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      saturatedFat: 0,
      transFat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
      vitaminC: 0,
      vitaminD: 0
    });
  });

  test("rejects a malformed date", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/summary/daily?date=bad-date")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe("GET /api/summary/by-meal", () => {
  test("groups totals by meal with empty meals zeroed", async () => {
    const token = await seedUserWithDay();

    const response = await request(app)
      .get(`/api/summary/by-meal?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.meals.Breakfast.calories).toBe(300);
    expect(response.body.meals.Breakfast.sodium).toBe(200);
    expect(response.body.meals.Lunch.calories).toBe(500);
    expect(response.body.meals.Dinner.calories).toBe(0);
    expect(response.body.meals.Snack.calories).toBe(0);
  });
});

describe("GET /api/summary/weekly", () => {
  test("returns seven days of totals from the start date", async () => {
    const token = await seedUserWithDay();

    const response = await request(app)
      .get(`/api/summary/weekly?startDate=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.startDate).toBe(DATE);
    expect(response.body.endDate).toBe("2026-07-16");
    expect(response.body.days).toHaveLength(7);
    expect(response.body.days[0].totals.calories).toBe(800);
    expect(response.body.days[1].totals.calories).toBe(0);
  });

  test("rejects a malformed start date", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/summary/weekly?startDate=2026/07/10")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
