import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../types";
import {
  clearSession,
  getMe,
  getStoredToken,
  getStoredUser,
  login as apiLogin,
  logout as apiLogout,
  storeSession,
  storeUser
} from "./api";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    if (!getStoredToken()) {
      return;
    }

    getMe()
      .then((data) => {
        setUser(data.user);
        storeUser(data.user);
      })
      .catch(() => {
        // A 401 is already handled by the api layer (session cleared + redirect).
      });
  }, []);

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    storeSession(data.token, data.user);
    setUser(data.user);
  }

  function logout() {
    apiLogout().catch(() => {});
    clearSession();
    setUser(null);
  }

  function updateUser(nextUser: User) {
    setUser(nextUser);
    storeUser(nextUser);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!getStoredToken()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
