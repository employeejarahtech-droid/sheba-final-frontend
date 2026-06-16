/**
 * Cookie utility functions using manual document.cookie approach
 * Replaces js-cookie dependency for better consistency
 */

import { getBaseDomain, RESERVED_SUBDOMAINS } from './subdomain'

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const host = window.location.hostname
  const BASE_DOMAIN = getBaseDomain()

  // Localhost: don't set domain (browsers reject it)
  if (host === 'localhost' || host === '127.0.0.1') return undefined

  // Base domain itself or www → platform, share cookie across platform pages
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return `.${BASE_DOMAIN}`
  }

  // *.BASE_DOMAIN tenant subdomain (e.g. abbas.hms.me, mojo.hms.me)
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = host.replace(`.${BASE_DOMAIN}`, '')
    // Reserved subdomains are platform pages → share cookie
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return `.${BASE_DOMAIN}`
    }
    // Tenant subdomain → cookie scoped to THIS subdomain only
    return undefined
  }

  // Unknown domains → no domain attribute
  return undefined
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    // URL decode the value
    return cookieValue ? decodeURIComponent(cookieValue) : undefined
  }
  return undefined
}

/**
 * Set a cookie with name, value, and optional max age
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  // URL encode the value to handle special characters (JWT tokens, etc.)
  const encodedValue = encodeURIComponent(value)
  const domain = getCookieDomain()
  const domainStr = domain ? `; domain=${domain}` : ''
  document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAge}; SameSite=Lax${domainStr}`
}

/**
 * Remove a cookie by setting its max age to 0
 *
 * Removes from ALL possible domain scopes to handle the case where
 * a cookie was set on a subdomain but the user is now on the base domain
 * — or vice versa.
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return

  const BASE_DOMAIN = getBaseDomain()
  const removalStr = `; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`

  // 1. Remove without domain (covers cookies set on current host only)
  document.cookie = `${name}=${removalStr}`

  // 2. Remove with base domain (covers cookies set from subdomains)
  if (BASE_DOMAIN) {
    document.cookie = `${name}=${removalStr}; domain=.${BASE_DOMAIN}`
  }

  // 3. If current host is a subdomain, also try removing for just this host
  const domain = getCookieDomain()
  if (domain) {
    document.cookie = `${name}=${removalStr}; domain=${domain}`
  }
}

// ── User-specific cookie helpers ────────────────────────────────────────

/**
 * Get user data from cookie
 */
export function getUserCookie<T = any>(): T | null {
  if (typeof document === 'undefined') return null

  const raw = getCookie('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Set user data in cookie
 */
export function setUserCookie(user: any): void {
  if (typeof document === 'undefined') return

  const userStr = JSON.stringify(user)
  setCookie('user', userStr, DEFAULT_MAX_AGE)
}

/**
 * Remove user data from cookie
 */
export function removeUserCookie(): void {
  removeCookie('user')
}
