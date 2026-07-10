import type {
  DailySummary,
  FoodEntry,
  FoodEntryInput,
  MacroGoal,
  MacroGoalInput,
  MealType,
  User,
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

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

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
