import request from "supertest";
import app from "../../app.js";
import { foodPayload, registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

async function createFood(token, overrides = {}) {
  const response = await request(app)
    .post("/api/foods")
    .set("Authorization", `Bearer ${token}`)
    .send(foodPayload(overrides));

  return response;
}

describe("authentication guard", () => {
  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/foods");

    expect(response.status).toBe(401);
  });
});

describe("POST /api/foods", () => {
  test("creates a food entry with all nutrients", async () => {
    const { token } = await registerVerifiedUser();
    const response = await createFood(token);

    expect(response.status).toBe(201);
    expect(response.body.foodEntry).toMatchObject({
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
      source: "manual",
      confidence: null,
      date: "2026-07-10"
    });
    expect(response.body.foodEntry.id).toBeTruthy();
  });

  test("rejects a payload missing sodium", async () => {
    const { token } = await registerVerifiedUser();
    const payload = foodPayload();
    delete payload.sodium;

    const response = await request(app)
      .post("/api/foods")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(400);
  });

  test("rejects negative nutrition values", async () => {
    const { token } = await registerVerifiedUser();
    const response = await createFood(token, { saturatedFat: -1 });

    expect(response.status).toBe(400);
  });

  test("rejects an invalid meal type", async () => {
    const { token } = await registerVerifiedUser();
    const response = await createFood(token, { mealType: "Brunch" });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/foods", () => {
  test("filters by date", async () => {
    const { token } = await registerVerifiedUser();
    await createFood(token, { date: "2026-07-10" });
    await createFood(token, { foodName: "Oatmeal", date: "2026-07-11" });

    const response = await request(app)
      .get("/api/foods?date=2026-07-10")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.foodEntries).toHaveLength(1);
    expect(response.body.foodEntries[0].date).toBe("2026-07-10");
  });

  test("rejects a malformed date", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/foods?date=07-10-2026")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe("ownership and lookup", () => {
  test("does not expose another user's entry", async () => {
    const owner = await registerVerifiedUser();
    const intruder = await registerVerifiedUser();
    const created = await createFood(owner.token);

    const response = await request(app)
      .get(`/api/foods/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${intruder.token}`);

    expect(response.status).toBe(404);
  });

  test("returns 404 for a malformed id", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/foods/not-an-object-id")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});

describe("PUT /api/foods/:id", () => {
  test("updates a subset of fields", async () => {
    const { token } = await registerVerifiedUser();
    const created = await createFood(token);

    const response = await request(app)
      .put(`/api/foods/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ calories: 300, sodium: 200 });

    expect(response.status).toBe(200);
    expect(response.body.foodEntry.calories).toBe(300);
    expect(response.body.foodEntry.sodium).toBe(200);
    expect(response.body.foodEntry.protein).toBe(52);
  });

  test("rejects an empty update", async () => {
    const { token } = await registerVerifiedUser();
    const created = await createFood(token);

    const response = await request(app)
      .put(`/api/foods/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/foods/:id", () => {
  test("deletes an entry", async () => {
    const { token } = await registerVerifiedUser();
    const created = await createFood(token);

    const deleteResponse = await request(app)
      .delete(`/api/foods/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/foods/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });
});

describe("GET /api/foods/search", () => {
  test("requires a query", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/foods/search")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test("matches case-insensitive substrings", async () => {
    const { token } = await registerVerifiedUser();
    await createFood(token, { foodName: "Grilled Chicken Breast" });
    await createFood(token, { foodName: "Oatmeal" });

    const response = await request(app)
      .get("/api/foods/search?query=chick")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.foodEntries).toHaveLength(1);
    expect(response.body.foodEntries[0].foodName).toBe("Grilled Chicken Breast");
  });

  test("treats regex characters literally", async () => {
    const { token } = await registerVerifiedUser();
    await createFood(token, { foodName: "Chicken (grilled)" });

    const response = await request(app)
      .get("/api/foods/search?query=(grilled)")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.foodEntries).toHaveLength(1);
  });

  test("only searches the authenticated user's foods", async () => {
    const owner = await registerVerifiedUser();
    const other = await registerVerifiedUser();
    await createFood(owner.token, { foodName: "Owner Special" });

    const response = await request(app)
      .get("/api/foods/search?query=owner")
      .set("Authorization", `Bearer ${other.token}`);

    expect(response.body.foodEntries).toHaveLength(0);
  });
});

describe("GET /api/foods/recent", () => {
  test("dedupes repeated foods", async () => {
    const { token } = await registerVerifiedUser();
    await createFood(token, { date: "2026-07-08" });
    await createFood(token, { date: "2026-07-09" });
    await createFood(token, { foodName: "Oatmeal", date: "2026-07-09" });

    const response = await request(app)
      .get("/api/foods/recent")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.foodEntries).toHaveLength(2);

    const names = response.body.foodEntries.map((entry) => entry.foodName);
    expect(names).toContain("Grilled Chicken Breast");
    expect(names).toContain("Oatmeal");
  });
});

describe("POST /api/foods/quick-add/:id", () => {
  test("copies an entry to a new date", async () => {
    const { token } = await registerVerifiedUser();
    const created = await createFood(token, { date: "2026-07-08" });

    const response = await request(app)
      .post(`/api/foods/quick-add/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-07-10" });

    expect(response.status).toBe(201);
    expect(response.body.foodEntry.date).toBe("2026-07-10");
    expect(response.body.foodEntry.foodName).toBe("Grilled Chicken Breast");
    expect(response.body.foodEntry.sodium).toBe(130);
    expect(response.body.foodEntry.potassium).toBe(450);
    expect(response.body.foodEntry.source).toBe("manual");
    expect(response.body.foodEntry.id).not.toBe(created.body.foodEntry.id);
  });

  test("overrides the meal type when provided", async () => {
    const { token } = await registerVerifiedUser();
    const created = await createFood(token, { mealType: "Lunch" });

    const response = await request(app)
      .post(`/api/foods/quick-add/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-07-11", mealType: "Dinner" });

    expect(response.status).toBe(201);
    expect(response.body.foodEntry.mealType).toBe("Dinner");
  });

  test("cannot quick-add another user's entry", async () => {
    const owner = await registerVerifiedUser();
    const intruder = await registerVerifiedUser();
    const created = await createFood(owner.token);

    const response = await request(app)
      .post(`/api/foods/quick-add/${created.body.foodEntry.id}`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ date: "2026-07-10" });

    expect(response.status).toBe(404);
  });
});
