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

  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = getCookie(ACCESS_TOKEN) || "";

  return {
    user: null,
    accessToken: token,

    setAuth: (user, token) => {
      setCookie(ACCESS_TOKEN, token); // store raw string
      set(() => ({ user, accessToken: token }));
    },

    logout: () => {
      removeCookie(ACCESS_TOKEN);
      set(() => ({ user: null, accessToken: "" }));
    },
  };
});
