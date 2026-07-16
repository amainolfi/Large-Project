import { addDays, getTodayDateString, isDateString } from "../../utils/date.js";

describe("getTodayDateString", () => {
  test("returns a YYYY-MM-DD string", () => {
    expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isDateString", () => {
  test("accepts real YYYY-MM-DD calendar dates", () => {
    expect(isDateString("2026-07-10")).toBe(true);
    expect(isDateString("2028-02-29")).toBe(true);
  });

  test("rejects other formats, impossible dates, and non-strings", () => {
    expect(isDateString("07/10/2026")).toBe(false);
    expect(isDateString("2026-7-10")).toBe(false);
    expect(isDateString("2026-02-29")).toBe(false);
    expect(isDateString("2026-13-01")).toBe(false);
    expect(isDateString("")).toBe(false);
    expect(isDateString(20260710)).toBe(false);
    expect(isDateString(null)).toBe(false);
  });
});

describe("addDays", () => {
  test("adds days within a month", () => {
    expect(addDays("2026-07-10", 5)).toBe("2026-07-15");
  });

  test("rolls over month and year boundaries", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("supports negative offsets", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });

  test("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});
