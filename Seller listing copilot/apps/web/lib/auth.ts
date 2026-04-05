import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_KEY = "listingpilot_auth_token";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthOrg {
  id: string;
  name: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  org: AuthOrg | null;
  login: (token: string, user: AuthUser, org: AuthOrg | null) => void;
  logout: () => void;
  setOrg: (org: AuthOrg | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      org: null,
      login: (token, user, org) => {
        setToken(token);
        set({ token, user, org });
      },
      logout: () => {
        clearToken();
        set({ token: null, user: null, org: null });
      },
      setOrg: (org) => set({ org }),
    }),
    {
      name: "listingpilot-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        org: state.org,
      }),
    },
  ),
);
