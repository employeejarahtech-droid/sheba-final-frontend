import { useEffect, useState } from 'react'
import { getSubdomainInfo, getPlatformUrl } from '@/lib/subdomain'
import { AlertTriangle } from 'lucide-react'

export type TenantExistsStatus = 'loading' | 'found' | 'notfound' | 'unknown'

/**
 * Checks whether the current tenant subdomain is actually registered by
 * calling the public tenant-settings endpoint (HTTP 404 = no tenant).
 *
 * - On a tenant subdomain: returns 'loading' → 'found' | 'notfound'.
 * - On the platform domain: returns 'unknown' (caller decides).
 * - On network error: returns 'found' so the page renders normally instead
 *   of wrongly showing "not found".
 */
export function useTenantExists(): {
  status: TenantExistsStatus
  subdomain: string | null
} {
  const { isCompanyPortal, subdomain } = getSubdomainInfo()
  const [status, setStatus] = useState<TenantExistsStatus>('loading')

  useEffect(() => {
    if (!isCompanyPortal || !subdomain) {
      setStatus('unknown')
      return
    }
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/public/tenant-settings/${subdomain}`
        )
        if (cancelled) return
        setStatus(res.status === 404 ? 'notfound' : 'found')
      } catch {
        if (!cancelled) setStatus('found')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isCompanyPortal, subdomain])

  return { status, subdomain }
}

/**
 * "Hospital not found" view — shown when a tenant subdomain has no registered
 * account. Offers a link to register on the platform.
 */
export function TenantNotFoundView({ subdomain }: { subdomain: string | null }) {
  const registerUrl = getPlatformUrl('/register')
  const homeUrl = getPlatformUrl('/')

  return (
    <div className="flex min-h-svh items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Hospital not found</h1>
          <p className="text-sm text-slate-500">
            We couldn't find an account for{' '}
            <span className="font-semibold text-slate-700">{subdomain}</span>. The
            subdomain may be incorrect, or this hospital hasn't been registered yet.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href={registerUrl}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Register an account
          </a>
          <a
            href={homeUrl}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Go to homepage
          </a>
        </div>
      </div>
    </div>
  )
}
