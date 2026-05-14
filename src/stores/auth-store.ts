import { create } from "zustand";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

const ACCESS_TOKEN = "accessToken";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string;

  setAuth: (user: AuthUser, token: string, remember?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = getCookie(ACCESS_TOKEN) || "";

  return {
    user: null,
    accessToken: token,

    setAuth: (user, token, remember = false) => {
      // Set cookie with 30 days expiry if remember is true, otherwise use default 7 days
      const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
      setCookie(ACCESS_TOKEN, token, maxAge); // store raw string
      set(() => ({ user, accessToken: token }));
    },

    logout: () => {
      removeCookie(ACCESS_TOKEN);
      set(() => ({ user: null, accessToken: "" }));
    },
  };
});
