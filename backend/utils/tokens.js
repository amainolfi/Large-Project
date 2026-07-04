import crypto from "crypto";
import jwt from "jsonwebtoken";

const DEFAULT_JWT_EXPIRES_IN = "7d";

export function createAuthToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN
    }
  );
}

export function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
