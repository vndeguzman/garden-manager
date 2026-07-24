import { useEffect, useState, type ReactNode } from "react";
import type { AuthResponseDto, LoginInput, RegisterInput, UserDto } from "@garden/shared";
import { api, setAuthToken } from "../api/client";
import { AuthContext } from "./auth-context";

const STORAGE_KEY = "garden-manager:auth";

function loadStored(): AuthResponseDto | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponseDto) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setAuthToken(stored.token);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  function persist(result: AuthResponseDto) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setAuthToken(result.token);
    setUser(result.user);
  }

  async function login(input: LoginInput) {
    const result = await api.post<AuthResponseDto>("/auth/login", input);
    persist(result);
  }

  async function register(input: RegisterInput) {
    const result = await api.post<AuthResponseDto>("/auth/register", input);
    persist(result);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}
