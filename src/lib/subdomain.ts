/**
 * Subdomain Detection Utility
 *
 * Determines if the current hostname is the platform base domain
 * or a tenant subdomain. Used for routing decisions.
 */

const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'staging', 'dev', 'test',
  'app', 'mail', 'ftp', 'portal', 'dashboard',
  'cdn', 'static', 'assets',
]

export { RESERVED_SUBDOMAINS }

interface SubdomainInfo {
  isCompanyPortal: boolean
  isPlatform: boolean
  subdomain: string | null
  baseDomain: string
  host: string
}

/**
 * Dynamically detect the base domain from the browser's hostname.
 *
 * Priority:
 *  1. VITE_BASE_DOMAIN env var (if explicitly set — backward compat)
 *  2. Runtime hostname parsing (e.g. admin.sheba.me → sheba.me, foo.lvh.me → lvh.me)
 *  3. Fallback to 'lvh.me'
 */
export function getBaseDomain(): string {
  // 1. Explicit env var always wins
  const envDomain = import.meta.env.VITE_BASE_DOMAIN
  if (envDomain) return envDomain

  // 2. SSR / no window → fallback
  if (typeof window === 'undefined') return 'lvh.me'

  const host = window.location.hostname

  // 3. localhost → fallback
  if (host === 'localhost' || host === '127.0.0.1') return 'lvh.me'

  // 4. Extract base domain by stripping the first segment (subdomain)
  // e.g. admin.sheba.me → sheba.me, foo.lvh.me → lvh.me, sheba.me → sheba.me
  const parts = host.split('.')
  if (parts.length >= 2) return parts.slice(-2).join('.')
  return host
}

/**
 * Build a display-friendly tenant domain string.
 * e.g. ("myhospital") → "myhospital.lvh.me" (dev) or "myhospital.sheba.me" (prod)
 */
export function getTenantDisplayDomain(subdomain: string | null | undefined): string {
  if (!subdomain) return '—'
  return `${subdomain}.${getBaseDomain()}`
}

/**
 * Custom-domain resolution cache, populated once at boot by
 * resolveCustomDomainOnBoot() (called from main.tsx before the router
 * mounts). undefined = not checked yet, null = checked — not a custom
 * domain, string = resolved tenant subdomain.
 */
let customDomainSubdomain: string | null | undefined = undefined

/**
 * Resolve the current hostname against the backend's custom-domain mapping
 * (companies.domain, set when a tenant's Domain Configuration goes live) if
 * it doesn't already match *.BASE_DOMAIN. Call once at app boot, before the
 * router mounts — getSubdomain()/getSubdomainInfo() then pick up the result
 * everywhere with no caller changes. Never throws; a failed/slow lookup
 * just leaves the hostname resolving as the platform, same as today.
 */
export async function resolveCustomDomainOnBoot(): Promise<void> {
  if (typeof window === 'undefined') return

  const base = getBaseDomain()
  const hostname = window.location.hostname.toLowerCase()

  // Already a recognized platform/tenant host — no need to ask the backend.
  if (hostname === 'localhost' || hostname === '127.0.0.1') return
  if (hostname === base || hostname === `www.${base}` || hostname.endsWith(`.${base}`)) return

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || ''}/api/public/resolve-domain?host=${encodeURIComponent(hostname)}`
    )
    if (!res.ok) return
    const data = await res.json()
    customDomainSubdomain = data.subdomain || null
  } catch {
    // Never block app boot on a failed lookup — fall back to platform.
  }
}

/**
 * Get the tenant subdomain from the current browser hostname.
 * Returns null if on the platform domain or a reserved subdomain.
 */
export function getSubdomain(baseDomain?: string): string | null {
  if (typeof window === 'undefined') return null

  if (typeof customDomainSubdomain === 'string') return customDomainSubdomain

  const base = (baseDomain || getBaseDomain()).toLowerCase()
  const hostname = window.location.hostname.toLowerCase()

  // Platform domain itself → no subdomain
  if (hostname === base) return null

  // Check if hostname ends with .{baseDomain}
  if (hostname.endsWith('.' + base)) {
    const subdomain = hostname.slice(0, -(base.length + 1))
    if (!subdomain || subdomain.length === 0) return null

    // Take the primary (last) part of multi-level subdomains
    const parts = subdomain.split('.')
    const primary = parts[parts.length - 1]

    // Filter reserved subdomains
    if (RESERVED_SUBDOMAINS.includes(primary)) return null

    return primary
  }

  // Not a *.baseDomain host and not resolved as a custom domain above.
  return null
}

/**
 * Returns true if the current hostname is the platform base domain.
 */
export function isPlatformDomain(baseDomain?: string): boolean {
  return getSubdomain(baseDomain) === null
}

/**
 * Full subdomain info — isCompanyPortal, subdomain, baseDomain, host.
 * Mirrors hms-frontend's getSubdomainInfo() for consistent routing decisions.
 */
export function getSubdomainInfo(): SubdomainInfo {
  const BASE_DOMAIN = getBaseDomain()

  if (typeof window === 'undefined') {
    return { isCompanyPortal: false, isPlatform: true, subdomain: null, baseDomain: BASE_DOMAIN, host: '' }
  }

  const host = window.location.hostname

  // Localhost without base domain → platform
  if (host === 'localhost' || host === '127.0.0.1') {
    return { isCompanyPortal: false, isPlatform: true, subdomain: null, baseDomain: BASE_DOMAIN, host }
  }

  // Base domain itself or www → platform
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return { isCompanyPortal: false, isPlatform: true, subdomain: null, baseDomain: BASE_DOMAIN, host }
  }

  // *.BASE_DOMAIN → tenant subdomain
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = host.replace(`.${BASE_DOMAIN}`, '')
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return { isCompanyPortal: false, isPlatform: true, subdomain: null, baseDomain: BASE_DOMAIN, host }
    }
    return { isCompanyPortal: true, isPlatform: false, subdomain, baseDomain: BASE_DOMAIN, host }
  }

  // Custom domain support: resolved once at boot by resolveCustomDomainOnBoot()
  // against companies.domain. Falls back to platform if unresolved/no match.
  if (typeof customDomainSubdomain === 'string') {
    return { isCompanyPortal: true, isPlatform: false, subdomain: customDomainSubdomain, baseDomain: BASE_DOMAIN, host }
  }
  return { isCompanyPortal: false, isPlatform: true, subdomain: null, baseDomain: BASE_DOMAIN, host }
}

export function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL
  if (configuredUrl) return configuredUrl
  return ''
}

export function getPlatformApiUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL
  if (configuredUrl) return configuredUrl
  return ''
}

/**
 * Build a full URL for a tenant subdomain.
 */
export function buildTenantUrl(subdomain: string): string {
  const protocol = window.location.protocol
  const port = window.location.port
  const portStr = port ? `:${port}` : ''
  return `${protocol}//${subdomain}.${getBaseDomain()}${portStr}`
}

/**
 * Build a full URL for a tenant subdomain with a path.
 */
export function getTenantUrl(subdomain: string, path: string = '/'): string {
  return `${buildTenantUrl(subdomain)}${path}`
}

/**
 * Build a full URL for the platform domain.
 */
export function getPlatformUrl(path: string = '/'): string {
  const base = getBaseDomain()
  const port = window.location.port
  const portStr = port ? `:${port}` : ''
  return `${window.location.protocol}//${base}${portStr}${path}`
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain)
}
