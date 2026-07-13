import {
  comparePassword,
  getPasswordRequirements,
  hashPassword,
  isStrongPassword
} from "../../utils/password.js";

describe("isStrongPassword", () => {
  test("accepts a password with upper, lower, digit, and special character", () => {
    expect(isStrongPassword("Passw0rd!")).toBe(true);
  });

  test("rejects passwords shorter than 8 characters", () => {
    expect(isStrongPassword("Pa0!abc")).toBe(false);
  });

  test("rejects passwords without an uppercase letter", () => {
    expect(isStrongPassword("passw0rd!")).toBe(false);
  });

  test("rejects passwords without a lowercase letter", () => {
    expect(isStrongPassword("PASSW0RD!")).toBe(false);
  });

  test("rejects passwords without a digit", () => {
    expect(isStrongPassword("Password!")).toBe(false);
  });

  test("rejects passwords without a special character", () => {
    expect(isStrongPassword("Passw0rd1")).toBe(false);
  });

  test("rejects non-string values", () => {
    expect(isStrongPassword(12345678)).toBe(false);
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(null)).toBe(false);
  });
});

describe("hashPassword and comparePassword", () => {
  test("hashes a password and verifies the round trip", async () => {
    const hash = await hashPassword("Passw0rd!");

    expect(hash).not.toBe("Passw0rd!");
    expect(await comparePassword("Passw0rd!", hash)).toBe(true);
    expect(await comparePassword("WrongPass1!", hash)).toBe(false);
  });
});

describe("getPasswordRequirements", () => {
  test("describes the complexity rules", () => {
    const message = getPasswordRequirements();

    expect(message).toMatch(/8 characters/);
    expect(message).toMatch(/uppercase/);
    expect(message).toMatch(/special character/);
  });
});
