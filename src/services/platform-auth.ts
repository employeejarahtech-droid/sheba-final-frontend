/**
 * Platform Auth Service — Admin login/refresh API calls
 *
 * Mirrors src/services/auth.ts pattern: raw fetch, no auth headers.
 */

import type { PlatformAdminUser } from '@/types/platform.types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

interface AdminLoginResponse {
  success: boolean
  data: {
    token: string
    user: PlatformAdminUser
  }
  message?: string
}

interface AdminRefreshResponse {
  success: boolean
  data: { token: string }
}

export async function adminLoginApi(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Login failed')
  }

  return data
}

export async function adminRefreshToken(
  currentToken: string
): Promise<AdminRefreshResponse> {
  const res = await fetch(`${BASE_URL}/api/admin/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Token refresh failed')
  }

  return data
}
