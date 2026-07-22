import { getIsoWeekRange, percentage } from "../../utils/wellness.js";

describe("getIsoWeekRange", () => {
  test("returns Monday through Sunday for a weekday", () => {
    expect(getIsoWeekRange("2026-07-21")).toEqual({
      startDate: "2026-07-20",
      endDate: "2026-07-26"
    });
  });

  test("keeps Sunday in the week that started six days earlier", () => {
    expect(getIsoWeekRange("2026-07-26")).toEqual({
      startDate: "2026-07-20",
      endDate: "2026-07-26"
    });
  });

  test("handles month and year boundaries", () => {
    expect(getIsoWeekRange("2027-01-01")).toEqual({
      startDate: "2026-12-28",
      endDate: "2027-01-03"
    });
  });
});

describe("percentage", () => {
  test("returns a one-decimal percentage", () => {
    expect(percentage(450, 480)).toBe(93.8);
  });

  test("returns zero when a goal is disabled", () => {
    expect(percentage(100, 0)).toBe(0);
  });
});
