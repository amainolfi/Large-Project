import request from "supertest";
import app from "../../app.js";
import { STRONG_PASSWORD, registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const registerBody = {
  firstName: "Anthony",
  lastName: "Tester",
  email: "auth@example.com",
  password: STRONG_PASSWORD
};

describe("POST /api/auth/register", () => {
  test("creates a user and returns a verification token in development", async () => {
    const response = await request(app).post("/api/auth/register").send(registerBody);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("auth@example.com");
    expect(response.body.user.isEmailVerified).toBe(false);
    expect(response.body.developmentToken).toMatch(/^[0-9a-f]{64}$/);
  });

  test("rejects weak passwords with the requirements message", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...registerBody, password: "weakpass" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/8 characters/);
  });

  test("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(registerBody);
    const response = await request(app).post("/api/auth/register").send(registerBody);

    expect(response.status).toBe(409);
  });

  test("rejects an invalid body with 400", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: STRONG_PASSWORD });

    expect(response.status).toBe(400);
  });
});

describe("email verification and login", () => {
  test("blocks login before the email is verified", async () => {
    await request(app).post("/api/auth/register").send(registerBody);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: registerBody.email, password: STRONG_PASSWORD });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/verify/i);
  });

  test("verifies the email and then allows login", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send(registerBody);

    const verifyResponse = await request(app).get(
      `/api/auth/verify-email/${registerResponse.body.developmentToken}`
    );

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.user.isEmailVerified).toBe(true);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: registerBody.email, password: STRONG_PASSWORD });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTruthy();
    expect(loginResponse.body.user.email).toBe(registerBody.email);
  });

  test("rejects an invalid verification token", async () => {
    const response = await request(app).get(`/api/auth/verify-email/${"0".repeat(64)}`);

    expect(response.status).toBe(400);
  });

  test("rejects a wrong password with 401", async () => {
    await registerVerifiedUser({ email: registerBody.email });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: registerBody.email, password: "Wrong0ne!Pass" });

    expect(response.status).toBe(401);
  });

  test("rejects an unknown email with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: STRONG_PASSWORD });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  test("requires a token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  test("returns the authenticated user", async () => {
    const { token, email } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
  });

  test("rejects a tampered token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");

    expect(response.status).toBe(401);
  });
});

describe("password reset flow", () => {
  test("responds generically for unknown emails without leaking a token", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.developmentToken).toBeUndefined();
  });

  test("resets the password end to end", async () => {
    const { email } = await registerVerifiedUser();

    const forgotResponse = await request(app).post("/api/auth/forgot-password").send({ email });
    expect(forgotResponse.body.developmentToken).toMatch(/^[0-9a-f]{64}$/);

    const weakReset = await request(app)
      .post(`/api/auth/reset-password/${forgotResponse.body.developmentToken}`)
      .send({ newPassword: "weak" });
    expect(weakReset.status).toBe(400);

    const resetResponse = await request(app)
      .post(`/api/auth/reset-password/${forgotResponse.body.developmentToken}`)
      .send({ newPassword: "NewPassw0rd!X" });
    expect(resetResponse.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: STRONG_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "NewPassw0rd!X" });
    expect(newLogin.status).toBe(200);
  });

  test("rejects an expired or invalid reset token", async () => {
    const response = await request(app)
      .post(`/api/auth/reset-password/${"0".repeat(64)}`)
      .send({ newPassword: "NewPassw0rd!X" });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/resend-verification", () => {
  test("reports already-verified accounts", async () => {
    const { email } = await registerVerifiedUser();

    const response = await request(app).post("/api/auth/resend-verification").send({ email });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/already verified/i);
  });

  test("issues a fresh token for unverified accounts", async () => {
    await request(app).post("/api/auth/register").send(registerBody);

    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({ email: registerBody.email });

    expect(response.status).toBe(200);
    expect(response.body.developmentToken).toMatch(/^[0-9a-f]{64}$/);
  });
});
