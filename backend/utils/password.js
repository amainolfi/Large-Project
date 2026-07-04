import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function isStrongPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function getPasswordRequirements() {
  return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
