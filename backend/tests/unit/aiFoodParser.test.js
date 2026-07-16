import {
  buildOpenAiRequest,
  DEFAULT_AI_MODEL,
  parseOpenAiFoodLog
} from "../../services/aiFoodParser.js";

const parsedItem = {
  foodName: "Banana",
  servingSize: "1 medium",
  mealType: "Lunch",
  confidence: "high",
  calories: 105,
  protein: 1.3,
  carbs: 27,
  fat: 0.4,
  saturatedFat: 0.1,
  transFat: 0,
  fiber: 3.1,
  sodium: 1,
  potassium: 422,
  calcium: 6,
  iron: 0.3,
  vitaminC: 10.3,
  vitaminD: 0
};

function responseWith(payload) {
  return {
    output: [
      {
        content: [{ type: "output_text", text: JSON.stringify(payload) }]
      }
    ]
  };
}

describe("AI food parser request", () => {
  const originalModel = process.env.OPENAI_MODEL;
  const originalSafetySalt = process.env.AI_SAFETY_SALT;

  beforeEach(() => {
    process.env.AI_SAFETY_SALT = "unit-test-safety-salt";
    delete process.env.OPENAI_MODEL;
  });

  afterEach(() => {
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;

    if (originalSafetySalt === undefined) delete process.env.AI_SAFETY_SALT;
    else process.env.AI_SAFETY_SALT = originalSafetySalt;
  });

  test("uses the low-cost extraction model and strict structured output", () => {
    const body = buildOpenAiRequest({
      text: "I had a banana for lunch",
      defaultMealType: "Snack",
      userId: "user-123"
    });

    expect(body.model).toBe(DEFAULT_AI_MODEL);
    expect(body.store).toBe(false);
    expect(body.reasoning).toEqual({ effort: "none" });
    expect(body.text.format).toMatchObject({
      type: "json_schema",
      name: "food_log",
      strict: true
    });
    expect(body.text.format.schema.additionalProperties).toBe(false);
    expect(body.safety_identifier).toMatch(/^[a-f0-9]{64}$/);
    expect(body.input[1].content).toContain("I had a banana for lunch");
  });

  test("uses a stable privacy-preserving identifier per user", () => {
    const one = buildOpenAiRequest({ text: "banana", defaultMealType: "Snack", userId: "1" });
    const oneAgain = buildOpenAiRequest({
      text: "apple",
      defaultMealType: "Lunch",
      userId: "1"
    });
    const two = buildOpenAiRequest({ text: "banana", defaultMealType: "Snack", userId: "2" });

    expect(one.safety_identifier).toBe(oneAgain.safety_identifier);
    expect(one.safety_identifier).not.toBe(two.safety_identifier);
    expect(one.safety_identifier).not.toBe("1");
  });
});

describe("AI food parser response validation", () => {
  test("accepts a valid food extraction", () => {
    const result = parseOpenAiFoodLog(
      responseWith({ accepted: true, rejectionCode: "none", items: [parsedItem] })
    );

    expect(result.items[0]).toEqual(parsedItem);
  });

  test("accepts a safe rejection without food items", () => {
    const result = parseOpenAiFoodLog(
      responseWith({ accepted: false, rejectionCode: "not_food", items: [] })
    );

    expect(result).toEqual({ accepted: false, rejectionCode: "not_food", items: [] });
  });

  test("rejects malformed JSON and out-of-range nutrition", () => {
    const malformed = { output: [{ content: [{ type: "output_text", text: "not json" }] }] };
    const excessive = responseWith({
      accepted: true,
      rejectionCode: "none",
      items: [{ ...parsedItem, calories: 5001 }]
    });

    expect(() => parseOpenAiFoodLog(malformed)).toThrow("invalid data");
    expect(() => parseOpenAiFoodLog(excessive)).toThrow("outside the allowed range");
  });

  test("rejects inconsistent accepted and item states", () => {
    expect(() =>
      parseOpenAiFoodLog(
        responseWith({ accepted: true, rejectionCode: "none", items: [] })
      )
    ).toThrow("outside the allowed range");
  });
});
