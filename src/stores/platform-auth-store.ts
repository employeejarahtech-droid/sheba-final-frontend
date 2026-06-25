/**
 * Platform Admin Auth Store — Zustand + cookie-based token management
 *
 * Mirrors src/stores/auth-store.ts but uses 'adminAccessToken' cookie
 * so platform admin and tenant sessions can coexist.
 */

import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import type { PlatformAdminUser } from '@/types/platform.types'

const ADMIN_TOKEN_KEY = 'adminAccessToken'

/**
 * Decode the platform admin role from the JWT stored in the adminAccessToken
 * cookie, without verifying the signature (the backend is authoritative).
 * Returns null when no token is present or it can't be parsed.
 */
export function getAdminRoleFromToken(): string | null {
  const token = getCookie(ADMIN_TOKEN_KEY)
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json).role ?? null
  } catch {
    return null
  }
}

interface PlatformAuthState {
  user: PlatformAdminUser | null
  accessToken: string
  setAuth: (user: PlatformAdminUser, token: string, remember?: boolean) => void
  logout: () => void
}

export const usePlatformAuthStore = create<PlatformAuthState>((set) => {
  const token = getCookie(ADMIN_TOKEN_KEY) || ''

  return {
    user: null,
    accessToken: token,

    setAuth: (user, token, remember = false) => {
      const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
      setCookie(ADMIN_TOKEN_KEY, token, maxAge)
      set(() => ({ user, accessToken: token }))
    },

    logout: () => {
      removeCookie(ADMIN_TOKEN_KEY)
      set(() => ({ user: null, accessToken: '' }))
    },
  }
})
