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
