import request from "supertest";
import app from "../../app.js";
import { goalsPayload, registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe("GET /api/goals", () => {
  test("requires authentication", async () => {
    const response = await request(app).get("/api/goals");

    expect(response.status).toBe(401);
  });

  test("returns null before goals are set", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/goals")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.goals).toBeNull();
  });
});

describe("PUT /api/goals", () => {
  test("creates goals with macro and micronutrient targets and limits", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalsPayload());

    expect(response.status).toBe(200);
    expect(response.body.goals).toMatchObject({
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
      dailyVitaminD: 20
    });
  });

  test("upserts instead of duplicating on repeat saves", async () => {
    const { token } = await registerVerifiedUser();

    const first = await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalsPayload());

    const second = await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalsPayload({ dailyCalories: 2400 }));

    expect(second.status).toBe(200);
    expect(second.body.goals.id).toBe(first.body.goals.id);
    expect(second.body.goals.dailyCalories).toBe(2400);
  });

  test("rejects negative values", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalsPayload({ dailySodium: -5 }));

    expect(response.status).toBe(400);
  });

  test("rejects a missing field", async () => {
    const { token } = await registerVerifiedUser();
    const payload = goalsPayload();
    delete payload.dailyTransFat;

    const response = await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(400);
  });
});
