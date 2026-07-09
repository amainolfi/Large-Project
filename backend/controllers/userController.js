import { z } from "zod";
import FoodEntry from "../models/FoodEntry.js";
import MacroGoal from "../models/MacroGoal.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import User from "../models/User.js";
import VerificationToken from "../models/VerificationToken.js";
import { formatUser } from "../utils/formatters.js";
import {
  comparePassword,
  getPasswordRequirements,
  hashPassword,
  isStrongPassword
} from "../utils/password.js";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
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

export function getProfile(req, res) {
  res.json({ user: formatUser(req.user) });
}

export async function updateProfile(req, res) {
  const data = parseBody(profileSchema, req.body);

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "At least one profile field is required." });
  }

  Object.assign(req.user, data);
  await req.user.save();

  res.json({
    message: "Profile updated successfully.",
    user: formatUser(req.user)
  });
}

export async function changePassword(req, res) {
  const data = parseBody(passwordSchema, req.body);

  if (!isStrongPassword(data.newPassword)) {
    return res.status(400).json({ message: getPasswordRequirements() });
  }

  const user = await User.findById(req.user._id).select("+passwordHash");
  const passwordMatches = await comparePassword(data.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  user.passwordHash = await hashPassword(data.newPassword);
  await user.save();
  await PasswordResetToken.deleteMany({ userId: user._id });

  res.json({ message: "Password changed successfully." });
}

export async function deleteAccount(req, res) {
  const userId = req.user._id;

  await Promise.all([
    FoodEntry.deleteMany({ userId }),
    MacroGoal.deleteMany({ userId }),
    VerificationToken.deleteMany({ userId }),
    PasswordResetToken.deleteMany({ userId })
  ]);

  await User.deleteOne({ _id: userId });

  res.json({ message: "Account deleted successfully." });
}
