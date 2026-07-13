import request from "supertest";
import app from "../../app.js";
import FoodEntry from "../../models/FoodEntry.js";
import MacroGoal from "../../models/MacroGoal.js";
import User from "../../models/User.js";
import { STRONG_PASSWORD, foodPayload, goalsPayload, registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

describe("GET /api/users/profile", () => {
  test("returns the authenticated user's profile", async () => {
    const { token, email } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
  });
});

describe("PUT /api/users/profile", () => {
  test("updates first and last name", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Updated", lastName: "Name" });

    expect(response.status).toBe(200);
    expect(response.body.user.firstName).toBe("Updated");
    expect(response.body.user.lastName).toBe("Name");
  });

  test("rejects an empty update", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe("PUT /api/users/password", () => {
  test("rejects a wrong current password", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Wrong0ne!Pass", newPassword: "NewPassw0rd!X" });

    expect(response.status).toBe(401);
  });

  test("rejects a weak new password", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: STRONG_PASSWORD, newPassword: "weak" });

    expect(response.status).toBe(400);
  });

  test("changes the password and allows login with the new one", async () => {
    const { token, email } = await registerVerifiedUser();

    const response = await request(app)
      .put("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: STRONG_PASSWORD, newPassword: "NewPassw0rd!X" });

    expect(response.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "NewPassw0rd!X" });

    expect(login.status).toBe(200);
  });
});

describe("DELETE /api/users/account", () => {
  test("deletes the user and cascades their data", async () => {
    const { token, user } = await registerVerifiedUser();

    await request(app)
      .post("/api/foods")
      .set("Authorization", `Bearer ${token}`)
      .send(foodPayload());

    await request(app)
      .put("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalsPayload());

    const response = await request(app)
      .delete("/api/users/account")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(await User.findById(user.id)).toBeNull();
    expect(await FoodEntry.countDocuments({ userId: user.id })).toBe(0);
    expect(await MacroGoal.countDocuments({ userId: user.id })).toBe(0);

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meResponse.status).toBe(401);
  });
});
