import { z } from "zod";
import PasswordResetToken from "../models/PasswordResetToken.js";
import User from "../models/User.js";
import VerificationToken from "../models/VerificationToken.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.js";
import { formatUser } from "../utils/formatters.js";
import {
  comparePassword,
  getPasswordRequirements,
  hashPassword,
  isStrongPassword
} from "../utils/password.js";
import { createAuthToken, createRandomToken, hashToken } from "../utils/tokens.js";

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string()
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
});

function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(" ");
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

function getTokenResponse(token) {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  return { developmentToken: token };
}

export async function register(req, res) {
  const data = parseBody(registerSchema, req.body);

  if (!isStrongPassword(data.password)) {
    return res.status(400).json({ message: getPasswordRequirements() });
  }

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash
  });

  const verificationToken = createRandomToken();
  await VerificationToken.create({
    userId: user._id,
    tokenHash: hashToken(verificationToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await sendVerificationEmail(user, verificationToken);

  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
    user: formatUser(user),
    ...getTokenResponse(verificationToken)
  });
}

export async function login(req, res) {
  const data = parseBody(loginSchema, req.body);
  const user = await User.findOne({ email: data.email }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await comparePassword(data.password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email before logging in." });
  }

  const token = createAuthToken(user);

  res.json({
    token,
    user: formatUser(user)
  });
}

export function logout(_req, res) {
  res.json({ message: "Logged out successfully." });
}

export async function verifyEmail(req, res) {
  const tokenHash = hashToken(req.params.token || "");
  const verificationToken = await VerificationToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() }
  });

  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid or expired verification token." });
  }

  const user = await User.findById(verificationToken.userId);

  if (!user) {
    return res.status(400).json({ message: "Invalid verification token." });
  }

  user.isEmailVerified = true;
  await user.save();
  await VerificationToken.deleteMany({ userId: user._id });

  res.json({
    message: "Email verified successfully.",
    user: formatUser(user)
  });
}

export async function resendVerification(req, res) {
  const data = parseBody(emailSchema, req.body);
  const user = await User.findOne({ email: data.email });

  if (!user) {
    return res.json({
      message: "If that email exists and is unverified, a verification email was sent."
    });
  }

  if (user.isEmailVerified) {
    return res.json({ message: "Email is already verified." });
  }

  await VerificationToken.deleteMany({ userId: user._id });

  const verificationToken = createRandomToken();
  await VerificationToken.create({
    userId: user._id,
    tokenHash: hashToken(verificationToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await sendVerificationEmail(user, verificationToken);

  res.json({
    message: "Verification email sent.",
    ...getTokenResponse(verificationToken)
  });
}

export async function forgotPassword(req, res) {
  const data = parseBody(emailSchema, req.body);
  const user = await User.findOne({ email: data.email });

  if (user) {
    await PasswordResetToken.deleteMany({ userId: user._id });

    const resetToken = createRandomToken();
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(resetToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    await sendPasswordResetEmail(user, resetToken);

    return res.json({
      message: "If that email exists, a password reset link was sent.",
      ...getTokenResponse(resetToken)
    });
  }

  res.json({ message: "If that email exists, a password reset link was sent." });
}

export async function resetPassword(req, res) {
  const data = parseBody(resetPasswordSchema, req.body);

  if (!isStrongPassword(data.newPassword)) {
    return res.status(400).json({ message: getPasswordRequirements() });
  }

  const resetToken = await PasswordResetToken.findOne({
    tokenHash: hashToken(req.params.token || ""),
    expiresAt: { $gt: new Date() }
  });

  if (!resetToken) {
    return res.status(400).json({ message: "Invalid or expired password reset token." });
  }

  const user = await User.findById(resetToken.userId).select("+passwordHash");

  if (!user) {
    return res.status(400).json({ message: "Invalid password reset token." });
  }

  user.passwordHash = await hashPassword(data.newPassword);
  await user.save();
  await PasswordResetToken.deleteMany({ userId: user._id });

  res.json({ message: "Password reset successfully." });
}

export function getMe(req, res) {
  res.json({ user: formatUser(req.user) });
}
