import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { registerVerifiedUser } from "../helpers.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../testDb.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFdcResponse(body, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
}

const fdcSearchResult = {
  totalHits: 3,
  currentPage: 1,
  totalPages: 1,
  foods: [
    {
      fdcId: 171077,
      description: "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      dataType: "SR Legacy",
      foodNutrients: [
        { nutrientId: 1008, value: 165 },
        { nutrientId: 1003, value: 31 },
        { nutrientId: 1005, value: 0 },
        { nutrientId: 1004, value: 3.6 },
        { nutrientId: 1258, value: 1.01 },
        { nutrientId: 1257, value: 0.045 },
        { nutrientId: 1079, value: 0 },
        { nutrientId: 1093, value: 74 },
        { nutrientId: 1092, value: 256 },
        { nutrientId: 1087, value: 15 },
        { nutrientId: 1089, value: 1.04 },
        { nutrientId: 1162, value: 0 },
        { nutrientId: 1114, value: 0.1 }
      ]
    },
    {
      fdcId: 2038064,
      description: "CHOCOLATE CHIP COOKIES",
      dataType: "Branded",
      brandOwner: "Cookie Co",
      servingSize: 50,
      servingSizeUnit: "g",
      householdServingFullText: "2 cookies",
      foodNutrients: [
        { nutrientId: 1008, value: 480 },
        { nutrientId: 1003, value: 5 },
        { nutrientId: 1005, value: 64 },
        { nutrientId: 1004, value: 24 },
        { nutrientId: 1258, value: 10 },
        { nutrientId: 1257, value: 0.2 },
        { nutrientId: 1079, value: 4 },
        { nutrientId: 1093, value: 350 },
        { nutrientId: 1092, value: 200 },
        { nutrientId: 1087, value: 40 },
        { nutrientId: 1089, value: 2 },
        { nutrientId: 1162, value: 1 },
        { nutrientId: 1114, value: 0.4 }
      ]
    },
    {
      fdcId: 2510795,
      description: "COLA SODA",
      dataType: "Branded",
      brandOwner: "Soda Co",
      servingSize: 12,
      servingSizeUnit: "OZA",
      householdServingFullText: "1 can",
      foodNutrients: [
        { nutrientId: 1008, value: 42 },
        { nutrientId: 1005, value: 11 },
        { nutrientId: 1093, value: 4 }
      ]
    }
  ]
};

describe("authentication guard", () => {
  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/preset-foods/search?query=chicken");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/preset-foods/search", () => {
  test("requires a search query", async () => {
    const { token } = await registerVerifiedUser();

    const response = await request(app)
      .get("/api/preset-foods/search")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test("maps USDA nutrients into the food entry shape", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse(fdcSearchResult);

    const response = await request(app)
      .get("/api/preset-foods/search?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(3);
    expect(response.body.foods[0]).toEqual({
      fdcId: 171077,
      foodName: "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      brand: null,
      dataType: "SR Legacy",
      servingSize: "100 g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      saturatedFat: 1,
      transFat: 0,
      fiber: 0,
      sodium: 74,
      potassium: 256,
      calcium: 15,
      iron: 1,
      vitaminC: 0,
      vitaminD: 0.1
    });
  });

  test("scales branded foods to their labeled serving size", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse(fdcSearchResult);

    const response = await request(app)
      .get("/api/preset-foods/search?query=cookies")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.foods[1]).toEqual({
      fdcId: 2038064,
      foodName: "CHOCOLATE CHIP COOKIES",
      brand: "Cookie Co",
      dataType: "Branded",
      servingSize: "2 cookies (50 g)",
      calories: 240,
      protein: 2.5,
      carbs: 32,
      fat: 12,
      saturatedFat: 5,
      transFat: 0.1,
      fiber: 2,
      sodium: 175,
      potassium: 100,
      calcium: 20,
      iron: 1,
      vitaminC: 0.5,
      vitaminD: 0.2
    });
  });

  test("keeps the 100 g label when the labeled serving cannot be scaled", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse(fdcSearchResult);

    const response = await request(app)
      .get("/api/preset-foods/search?query=cola")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    // servingSizeUnit "OZA" is not scalable, so the per-100ml values must stay
    // paired with a "100 g" label, not the "1 can" household text.
    expect(response.body.foods[2]).toMatchObject({
      servingSize: "100 g",
      calories: 42,
      carbs: 11,
      sodium: 4
    });
  });

  test("passes the query and pagination through to USDA", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse(fdcSearchResult);

    await request(app)
      .get("/api/preset-foods/search?query=oatmeal&page=3&pageSize=10")
      .set("Authorization", `Bearer ${token}`);

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("query=oatmeal");
    expect(calledUrl).toContain("pageNumber=3");
    expect(calledUrl).toContain("pageSize=10");
  });

  test("returns 502 when USDA is unavailable", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse({}, 500);

    const response = await request(app)
      .get("/api/preset-foods/search?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(502);
  });

  test("returns 429 when the USDA rate limit is hit", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse({}, 429);

    const response = await request(app)
      .get("/api/preset-foods/search?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(429);
  });

  test("returns 502 when the request to USDA fails outright", async () => {
    const { token } = await registerVerifiedUser();
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    const response = await request(app)
      .get("/api/preset-foods/search?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(502);
  });

  test("returns a clean 502 when USDA responds with a non-JSON body", async () => {
    const { token } = await registerVerifiedUser();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token '<'");
      }
    });

    const response = await request(app)
      .get("/api/preset-foods/search?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(502);
    expect(response.body.message).not.toContain("Unexpected token");
  });

  test("rate limits a user hammering the endpoint", async () => {
    const { token } = await registerVerifiedUser();
    mockFdcResponse(fdcSearchResult);

    let lastStatus = 200;

    for (let i = 0; i < 31; i += 1) {
      const response = await request(app)
        .get("/api/preset-foods/search?query=chicken")
        .set("Authorization", `Bearer ${token}`);

      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
