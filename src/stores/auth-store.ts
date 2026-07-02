import { create } from "zustand";
import { getCookie, setCookie, removeCookie, getUserCookie, setUserCookie, removeUserCookie } from "@/lib/cookies";
import { getCurrentUser } from "@/services/auth";

const ACCESS_TOKEN = "accessToken";

/**
 * Safety net: backend MySQL raw queries may return JSON columns as strings.
 * Ensures permissions/menu are always proper arrays.
 */
function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

type UserType = "staff" | "company_admin" | "platform_admin" | null;

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  userType?: UserType;
  companyId?: number;
  subdomain?: string;
  planId?: number;
  hide_subscription_info?: number;
  permissions?: string[];
  menu?: string[];
}

interface Company {
  id: number;
  name: string;
  subdomain: string;
  dbType: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  company: Company | null;
  isLoading: boolean;
  userType: UserType;

  setAuth: (user: AuthUser, token: string, company?: Company | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => void;
  loadFromCookies: () => void;
}

// Load helpers — cookies first, then localStorage
function loadValue(key: string): string | null {
  const fromCookie = getCookie(key);
  if (fromCookie) return fromCookie;
  const fromStorage = localStorage.getItem(key);
  return fromStorage;
}

function loadJSON<T>(key: string): T | null {
  const raw = loadValue(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Normalize the user object: ensure permissions/menu are proper arrays
 * regardless of whether the backend returned them as strings or arrays.
 */
function normalizeUser(user: any): AuthUser {
  if (!user) return user;
  return {
    ...user,
    permissions: ensureArray(user.permissions),
    menu: ensureArray(user.menu),
  };
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Initialize state from cookies/localStorage (triple-layer load)
  const initialToken = loadValue(ACCESS_TOKEN);
  const rawInitialUser = getUserCookie() || loadJSON<AuthUser>("user");
  const initialUser = rawInitialUser ? normalizeUser(rawInitialUser) : null;

  const fetchUser = async () => {
    const { accessToken } = get();
    if (!accessToken) {
      return;
    }

    try {
      set({ isLoading: true });
      const rawUser = await getCurrentUser(accessToken);
      const user = normalizeUser(rawUser);
      // Persist to all layers
      setUserCookie(user);
      localStorage.setItem("user", JSON.stringify(user));
      set({
        user,
        isLoading: false,
        userType: (user as any)?.userType || null,
      });
    } catch (error) {
      removeCookie(ACCESS_TOKEN);
      removeUserCookie();
      localStorage.removeItem("user");
      localStorage.removeItem("company");
      set({ user: null, accessToken: null, company: null, isLoading: false, userType: null });
    }
  };

  // If token exists but no user, fetch from API. MUST be deferred — calling it
  // synchronously here (during create()) runs before zustand assigns state, so
  // get() is undefined and `const { accessToken } = get()` throws. This state
  // is reached e.g. by the admin "login as tenant" hand-off, which sets only
  // the accessToken cookie.
  if (initialToken && !initialUser) {
    queueMicrotask(() => fetchUser());
  }

  return {
    user: initialUser,
    accessToken: initialToken,
    company: loadJSON<Company>("company"),
    isLoading: false,
    userType: (initialUser as any)?.userType || null,

    setAuth: (user, token, company) => {
      const normalizedUser = normalizeUser(user);
      // Layer 1: Cookies (cross-subdomain when on same domain)
      setCookie(ACCESS_TOKEN, token);
      setUserCookie(normalizedUser);
      if (company) setCookie("company", JSON.stringify(company));

      // Layer 2: localStorage (per-origin)
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      if (company) localStorage.setItem("company", JSON.stringify(company));

      // Layer 3: Zustand (in-memory)
      set({
        user: normalizedUser,
        accessToken: token,
        company: company || null,
        isLoading: false,
        userType: normalizedUser.userType || null,
      });
    },

    logout: () => {
      // Clear all 3 layers
      removeCookie(ACCESS_TOKEN);
      removeUserCookie();
      removeCookie("company");
      localStorage.removeItem("user");
      localStorage.removeItem("company");
      set({ user: null, accessToken: null, company: null, isLoading: false, userType: null });
    },

    updateProfile: (data) =>
      set((state) => ({
        user: state.user ? normalizeUser({ ...state.user, ...data }) : null,
      })),

    loadFromCookies: () => {
      const token = loadValue(ACCESS_TOKEN);
      const rawUser = getUserCookie() || loadJSON<AuthUser>("user");
      const company = loadJSON<Company>("company");
      if (token && rawUser) {
        const user = normalizeUser(rawUser);
        set({ user, accessToken: token, company, userType: (user as any)?.userType || null });
      }
    },

    fetchUser,
  };
});
