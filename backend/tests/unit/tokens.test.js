import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createAuthToken, createRandomToken, hashToken } from "../../utils/tokens.js";

describe("createAuthToken", () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    email: "token@example.com"
  };

  test("creates a JWT containing the user id and email", () => {
    const token = createAuthToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.userId).toBe(user._id.toString());
    expect(decoded.email).toBe(user.email);
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test("throws when JWT_SECRET is not configured", () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => createAuthToken(user)).toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = original;
  });
});

describe("createRandomToken", () => {
  test("returns a 64 character hex string", () => {
    const token = createRandomToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  test("returns a different token each call", () => {
    expect(createRandomToken()).not.toBe(createRandomToken());
  });
});

describe("hashToken", () => {
  test("is deterministic for the same input", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  test("differs for different inputs and never echoes the raw token", () => {
    const hash = hashToken("abc");

    expect(hash).not.toBe(hashToken("abd"));
    expect(hash).not.toContain("abc");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
