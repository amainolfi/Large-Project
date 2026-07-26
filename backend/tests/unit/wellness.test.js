import { formatWellnessGoals, percentage } from "../../utils/wellness.js";

describe("formatWellnessGoals", () => {
  test("returns daily defaults when no goals have been saved", () => {
    expect(formatWellnessGoals(null)).toMatchObject({
      id: null,
      dailyWaterMl: 2500,
      nightlySleepMinutes: 480,
      dailyCardioMinutes: 30
    });
  });

  test("returns the saved daily cardio target", () => {
    const goals = formatWellnessGoals({
      _id: { toString: () => "goal-1" },
      dailyWaterMl: 3000,
      nightlySleepMinutes: 450,
      dailyCardioMinutes: 40
    });

    expect(goals.dailyCardioMinutes).toBe(40);
    expect(goals).not.toHaveProperty("weeklyCardioMinutes");
  });

  test("converts a legacy weekly target to a daily equivalent", () => {
    expect(formatWellnessGoals({
      _id: { toString: () => "goal-1" },
      dailyWaterMl: 2500,
      nightlySleepMinutes: 480,
      weeklyCardioMinutes: 150
    })).toMatchObject({
      dailyCardioMinutes: 21
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
