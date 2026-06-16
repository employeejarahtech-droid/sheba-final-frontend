/**
 * Platform Authenticated Fetch — Admin API request wrapper
 *
 * Mirrors src/lib/authenticated-fetch.ts but uses the platform auth store
 * and redirects to /admin/login on 401 instead of /login.
 */

import { toast } from 'sonner'
import { usePlatformAuthStore } from '@/stores/platform-auth-store'

interface PlatformFetchOptions extends RequestInit {
  params?: Record<string, string>
}

const BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Authenticated fetch for platform admin API calls.
 * Automatically adds Bearer token from platform auth store.
 * Handles 401 by clearing admin session and redirecting to /admin/login.
 */
export async function platformAuthenticatedFetch(
  url: string,
  options: PlatformFetchOptions = {}
): Promise<Response> {
  const { accessToken: token } = usePlatformAuthStore.getState()

  if (!token) {
    toast.error('Admin session expired.')
    window.location.href = '/admin/login'
    throw new Error('No admin token available')
  }

  // Build full URL with query params
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  if (options.params) {
    const searchParams = new URLSearchParams(options.params)
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + searchParams.toString()
    delete options.params
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  // Handle 401 — admin token expired
  if (response.status === 401) {
    const { logout } = usePlatformAuthStore.getState()
    logout()
    toast.error('Admin session expired. Please login again.')
    setTimeout(() => {
      window.location.href = '/admin/login'
    }, 1500)
    throw new Error('Admin unauthorized')
  }

  return response
}

/**
 * Convenience: authenticated fetch that parses JSON response.
 */
export async function platformFetchJson<T>(
  url: string,
  options: PlatformFetchOptions = {}
): Promise<T> {
  const response = await platformAuthenticatedFetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}
