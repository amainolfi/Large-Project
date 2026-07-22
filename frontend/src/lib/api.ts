import type {
  AiFoodLogResponse,
  CardioEntry,
  CardioEntryInput,
  DailySummary,
  FoodEntry,
  FoodEntryInput,
  MacroGoal,
  MacroGoalInput,
  MealType,
  PresetFood,
  SleepEntry,
  SleepEntryInput,
  User,
  WaterEntry,
  WaterEntryInput,
  WellnessGoal,
  WellnessGoalInput,
  WellnessSummary,
  WeeklySummary
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "mt_token";
const USER_KEY = "mt_user";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getStoredToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession();
      window.location.href = "/";
    }

    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message);
  }

  return data as T;
}

// ---- Auth ----

export function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return request<{ message: string; user: User; developmentToken?: string }>(
    "/api/auth/register",
    { method: "POST", body: input, auth: false }
  );
}

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false
  });
}

export function logout() {
  return request<{ message: string }>("/api/auth/logout", { method: "POST" });
}

export function verifyEmail(token: string) {
  return request<{ message: string; user: User }>(`/api/auth/verify-email/${token}`, {
    auth: false
  });
}

export function resendVerification(email: string) {
  return request<{ message: string; developmentToken?: string }>(
    "/api/auth/resend-verification",
    { method: "POST", body: { email }, auth: false }
  );
}

export function forgotPassword(email: string) {
  return request<{ message: string; developmentToken?: string }>(
    "/api/auth/forgot-password",
    { method: "POST", body: { email }, auth: false }
  );
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>(`/api/auth/reset-password/${token}`, {
    method: "POST",
    body: { newPassword },
    auth: false
  });
}

export function getMe() {
  return request<{ user: User }>("/api/auth/me");
}

// ---- Foods ----

export function createFood(input: FoodEntryInput) {
  return request<{ foodEntry: FoodEntry }>("/api/foods", {
    method: "POST",
    body: input
  });
}

export function getFoods(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<{ foodEntries: FoodEntry[] }>(`/api/foods${query}`);
}

export function searchFoods(query: string, date?: string) {
  const params = new URLSearchParams({ query });

  if (date) {
    params.set("date", date);
  }

  return request<{ foodEntries: FoodEntry[] }>(`/api/foods/search?${params.toString()}`);
}

export function getRecentFoods() {
  return request<{ foodEntries: FoodEntry[] }>("/api/foods/recent");
}

export function quickAddFood(id: string, date: string, mealType?: MealType) {
  return request<{ foodEntry: FoodEntry }>(`/api/foods/quick-add/${id}`, {
    method: "POST",
    body: mealType ? { date, mealType } : { date }
  });
}

export function updateFood(id: string, input: Partial<FoodEntryInput>) {
  return request<{ foodEntry: FoodEntry }>(`/api/foods/${id}`, {
    method: "PUT",
    body: input
  });
}

export function deleteFood(id: string) {
  return request<{ message: string }>(`/api/foods/${id}`, { method: "DELETE" });
}

export function logFoodWithAi(input: { text: string; date: string; mealType: MealType }) {
  return request<AiFoodLogResponse>("/api/foods/ai-log", {
    method: "POST",
    body: input
  });
}

export function searchPresetFoods(query: string, page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    pageSize: String(pageSize)
  });

  return request<{
    foods: PresetFood[];
    totalResults: number;
    page: number;
    totalPages: number;
  }>(`/api/preset-foods/search?${params.toString()}`);
}

// ---- Goals ----

export function getGoals() {
  return request<{ goals: MacroGoal | null }>("/api/goals");
}

export function saveGoals(input: MacroGoalInput) {
  return request<{ message: string; goals: MacroGoal }>("/api/goals", {
    method: "PUT",
    body: input
  });
}

// ---- Summary ----

export function getDailySummary(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<DailySummary>(`/api/summary/daily${query}`);
}

export function getWeeklySummary(startDate?: string) {
  const query = startDate ? `?startDate=${encodeURIComponent(startDate)}` : "";
  return request<WeeklySummary>(`/api/summary/weekly${query}`);
}

// ---- Wellness ----

export function getWellnessSummary(date: string) {
  return request<WellnessSummary>(
    `/api/wellness/summary?date=${encodeURIComponent(date)}`
  );
}

export function getCardioEntries(date: string) {
  return request<{ cardioEntries: CardioEntry[] }>(
    `/api/wellness/cardio?date=${encodeURIComponent(date)}`
  );
}

export function createCardioEntry(input: CardioEntryInput) {
  return request<{ cardioEntry: CardioEntry }>("/api/wellness/cardio", {
    method: "POST",
    body: input
  });
}

export function updateCardioEntry(id: string, input: Partial<CardioEntryInput>) {
  return request<{ cardioEntry: CardioEntry }>(`/api/wellness/cardio/${id}`, {
    method: "PUT",
    body: input
  });
}

export function deleteCardioEntry(id: string) {
  return request<{ message: string }>(`/api/wellness/cardio/${id}`, {
    method: "DELETE"
  });
}

export function getWaterEntries(date: string) {
  return request<{ waterEntries: WaterEntry[] }>(
    `/api/wellness/water?date=${encodeURIComponent(date)}`
  );
}

export function createWaterEntry(input: WaterEntryInput) {
  return request<{ waterEntry: WaterEntry }>("/api/wellness/water", {
    method: "POST",
    body: input
  });
}

export function updateWaterEntry(id: string, input: Partial<WaterEntryInput>) {
  return request<{ waterEntry: WaterEntry }>(`/api/wellness/water/${id}`, {
    method: "PUT",
    body: input
  });
}

export function deleteWaterEntry(id: string) {
  return request<{ message: string }>(`/api/wellness/water/${id}`, {
    method: "DELETE"
  });
}

export function getSleepEntries(date: string) {
  return request<{ sleepEntries: SleepEntry[] }>(
    `/api/wellness/sleep?date=${encodeURIComponent(date)}`
  );
}

export function createSleepEntry(input: SleepEntryInput) {
  return request<{ sleepEntry: SleepEntry }>("/api/wellness/sleep", {
    method: "POST",
    body: input
  });
}

export function updateSleepEntry(id: string, input: Partial<SleepEntryInput>) {
  return request<{ sleepEntry: SleepEntry }>(`/api/wellness/sleep/${id}`, {
    method: "PUT",
    body: input
  });
}

export function deleteSleepEntry(id: string) {
  return request<{ message: string }>(`/api/wellness/sleep/${id}`, {
    method: "DELETE"
  });
}

export function getWellnessGoals() {
  return request<{ goals: WellnessGoal }>("/api/wellness/goals");
}

export function saveWellnessGoals(input: WellnessGoalInput) {
  return request<{ message: string; goals: WellnessGoal }>("/api/wellness/goals", {
    method: "PUT",
    body: input
  });
}

// ---- Users ----

export function updateProfile(input: { firstName?: string; lastName?: string }) {
  return request<{ message: string; user: User }>("/api/users/profile", {
    method: "PUT",
    body: input
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>("/api/users/password", {
    method: "PUT",
    body: { currentPassword, newPassword }
  });
}

export function deleteAccount() {
  return request<{ message: string }>("/api/users/account", { method: "DELETE" });
}
