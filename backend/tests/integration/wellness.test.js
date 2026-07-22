import request from "supertest";
import app from "../../app.js";
import CardioEntry from "../../models/CardioEntry.js";
import SleepEntry from "../../models/SleepEntry.js";
import WaterEntry from "../../models/WaterEntry.js";
import WellnessGoal from "../../models/WellnessGoal.js";
import {
  cardioPayload,
  registerVerifiedUser,
  sleepPayload,
  waterPayload,
  wellnessGoalsPayload
} from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

function authorized(method, path, token) {
  return request(app)[method](path).set("Authorization", `Bearer ${token}`);
}

describe("wellness authentication and goals", () => {
  test("protects every wellness route", async () => {
    const responses = await Promise.all([
      request(app).get("/api/wellness/summary"),
      request(app).get("/api/wellness/water"),
      request(app).get("/api/wellness/cardio"),
      request(app).get("/api/wellness/sleep"),
      request(app).get("/api/wellness/goals")
    ]);

    expect(responses.every((response) => response.status === 401)).toBe(true);
  });

  test("returns practical default goals before a user saves preferences", async () => {
    const { token } = await registerVerifiedUser();
    const response = await authorized("get", "/api/wellness/goals", token);

    expect(response.status).toBe(200);
    expect(response.body.goals).toMatchObject({
      id: null,
      dailyWaterMl: 2500,
      nightlySleepMinutes: 480,
      weeklyCardioMinutes: 150
    });
  });

  test("upserts validated wellness goals", async () => {
    const { token } = await registerVerifiedUser();
    const first = await authorized("put", "/api/wellness/goals", token).send(
      wellnessGoalsPayload()
    );
    const second = await authorized("put", "/api/wellness/goals", token).send(
      wellnessGoalsPayload({ dailyWaterMl: 3000 })
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.goals.id).toBe(first.body.goals.id);
    expect(second.body.goals.dailyWaterMl).toBe(3000);
    expect(await WellnessGoal.countDocuments()).toBe(1);
  });

  test("rejects out-of-range goals and unknown fields", async () => {
    const { token } = await registerVerifiedUser();
    const invalid = await authorized("put", "/api/wellness/goals", token).send(
      wellnessGoalsPayload({ nightlySleepMinutes: 1500 })
    );
    const extra = await authorized("put", "/api/wellness/goals", token).send({
      ...wellnessGoalsPayload(),
      admin: true
    });

    expect(invalid.status).toBe(400);
    expect(extra.status).toBe(400);
  });
});

describe("water tracking", () => {
  test("creates, lists, updates, and deletes a water entry", async () => {
    const { token } = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/water", token).send(
      waterPayload()
    );
    const id = created.body.waterEntry.id;
    const updated = await authorized("put", `/api/wellness/water/${id}`, token).send({
      amountMl: 750
    });
    const listed = await authorized(
      "get",
      "/api/wellness/water?date=2026-07-21",
      token
    );
    const deleted = await authorized("delete", `/api/wellness/water/${id}`, token);

    expect(created.status).toBe(201);
    expect(updated.body.waterEntry.amountMl).toBe(750);
    expect(listed.body.waterEntries).toHaveLength(1);
    expect(deleted.status).toBe(200);
    expect(await WaterEntry.countDocuments()).toBe(0);
  });

  test("rejects zero, oversized, and impossible-date water entries", async () => {
    const { token } = await registerVerifiedUser();
    const zero = await authorized("post", "/api/wellness/water", token).send(
      waterPayload({ amountMl: 0 })
    );
    const oversized = await authorized("post", "/api/wellness/water", token).send(
      waterPayload({ amountMl: 6000 })
    );
    const badDate = await authorized("post", "/api/wellness/water", token).send(
      waterPayload({ date: "2026-02-29" })
    );

    expect([zero.status, oversized.status, badDate.status]).toEqual([400, 400, 400]);
  });

  test("does not allow one user to change another user's water entry", async () => {
    const owner = await registerVerifiedUser();
    const other = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/water", owner.token).send(
      waterPayload()
    );

    const response = await authorized(
      "put",
      `/api/wellness/water/${created.body.waterEntry.id}`,
      other.token
    ).send({ amountMl: 900 });

    expect(response.status).toBe(404);
  });
});

describe("cardio tracking", () => {
  test("creates and lists a complete cardio entry", async () => {
    const { token } = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload()
    );
    const listed = await authorized(
      "get",
      "/api/wellness/cardio?date=2026-07-21",
      token
    );

    expect(created.status).toBe(201);
    expect(created.body.cardioEntry).toMatchObject(cardioPayload());
    expect(listed.body.cardioEntries).toHaveLength(1);
  });

  test("updates cardio fields without replacing omitted values", async () => {
    const { token } = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload()
    );
    const response = await authorized(
      "put",
      `/api/wellness/cardio/${created.body.cardioEntry.id}`,
      token
    ).send({ durationMinutes: 42, intensity: "moderate" });

    expect(response.status).toBe(200);
    expect(response.body.cardioEntry.durationMinutes).toBe(42);
    expect(response.body.cardioEntry.activityType).toBe("running");
    expect(response.body.cardioEntry.intensity).toBe("moderate");
  });

  test("rejects invalid activities and durations", async () => {
    const { token } = await registerVerifiedUser();
    const activity = await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload({ activityType: "teleporting" })
    );
    const duration = await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload({ durationMinutes: 0 })
    );

    expect(activity.status).toBe(400);
    expect(duration.status).toBe(400);
  });

  test("does not allow cross-user cardio deletion", async () => {
    const owner = await registerVerifiedUser();
    const other = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/cardio", owner.token).send(
      cardioPayload()
    );
    const response = await authorized(
      "delete",
      `/api/wellness/cardio/${created.body.cardioEntry.id}`,
      other.token
    );

    expect(response.status).toBe(404);
    expect(await CardioEntry.countDocuments()).toBe(1);
  });
});

describe("sleep tracking", () => {
  test("creates, lists, updates, and deletes sleep sessions", async () => {
    const { token } = await registerVerifiedUser();
    const created = await authorized("post", "/api/wellness/sleep", token).send(
      sleepPayload()
    );
    const id = created.body.sleepEntry.id;
    const updated = await authorized("put", `/api/wellness/sleep/${id}`, token).send({
      quality: "excellent",
      durationMinutes: 480
    });
    const listed = await authorized(
      "get",
      "/api/wellness/sleep?date=2026-07-21",
      token
    );
    const deleted = await authorized("delete", `/api/wellness/sleep/${id}`, token);

    expect(created.status).toBe(201);
    expect(updated.body.sleepEntry).toMatchObject({
      quality: "excellent",
      durationMinutes: 480,
      notes: "Woke up rested"
    });
    expect(listed.body.sleepEntries).toHaveLength(1);
    expect(deleted.status).toBe(200);
    expect(await SleepEntry.countDocuments()).toBe(0);
  });

  test("rejects impossible duration and quality values", async () => {
    const { token } = await registerVerifiedUser();
    const duration = await authorized("post", "/api/wellness/sleep", token).send(
      sleepPayload({ durationMinutes: 1500 })
    );
    const quality = await authorized("post", "/api/wellness/sleep", token).send(
      sleepPayload({ quality: "perfect" })
    );

    expect(duration.status).toBe(400);
    expect(quality.status).toBe(400);
  });
});

describe("wellness summary and cleanup", () => {
  test("aggregates daily hydration and sleep with ISO-week cardio progress", async () => {
    const { token } = await registerVerifiedUser();
    await authorized("put", "/api/wellness/goals", token).send(wellnessGoalsPayload());
    await authorized("post", "/api/wellness/water", token).send(waterPayload({ amountMl: 500 }));
    await authorized("post", "/api/wellness/water", token).send(waterPayload({ amountMl: 750 }));
    await authorized("post", "/api/wellness/sleep", token).send(sleepPayload());
    await authorized("post", "/api/wellness/cardio", token).send(cardioPayload());
    await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload({ date: "2026-07-24", durationMinutes: 45 })
    );
    await authorized("post", "/api/wellness/cardio", token).send(
      cardioPayload({ date: "2026-07-18", durationMinutes: 60 })
    );

    const response = await authorized(
      "get",
      "/api/wellness/summary?date=2026-07-21",
      token
    );

    expect(response.status).toBe(200);
    expect(response.body.totals).toEqual({
      waterMl: 1250,
      sleepMinutes: 450,
      cardioMinutes: 30,
      cardioCaloriesBurned: 320
    });
    expect(response.body.weekly).toEqual({
      startDate: "2026-07-20",
      endDate: "2026-07-26",
      cardioMinutes: 75
    });
    expect(response.body.progress).toEqual({
      waterPercent: 50,
      sleepPercent: 93.8,
      weeklyCardioPercent: 50
    });
  });

  test("rejects an impossible summary date", async () => {
    const { token } = await registerVerifiedUser();
    const response = await authorized(
      "get",
      "/api/wellness/summary?date=2026-13-10",
      token
    );

    expect(response.status).toBe(400);
  });

  test("account deletion removes every wellness document", async () => {
    const { token } = await registerVerifiedUser();
    await authorized("post", "/api/wellness/water", token).send(waterPayload());
    await authorized("post", "/api/wellness/cardio", token).send(cardioPayload());
    await authorized("post", "/api/wellness/sleep", token).send(sleepPayload());
    await authorized("put", "/api/wellness/goals", token).send(wellnessGoalsPayload());

    const response = await authorized("delete", "/api/users/account", token);

    expect(response.status).toBe(200);
    expect(await WaterEntry.countDocuments()).toBe(0);
    expect(await CardioEntry.countDocuments()).toBe(0);
    expect(await SleepEntry.countDocuments()).toBe(0);
    expect(await WellnessGoal.countDocuments()).toBe(0);
  });
});
