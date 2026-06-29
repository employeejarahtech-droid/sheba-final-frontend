import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Returns the effective current user, preferring the live /auth/me response
 * over the cached store user. The cached user (read from a cookie) can predate
 * permission/flag changes — e.g. a role whose permissions were edited after the
 * user last logged in — so anything that gates UI on permissions should read
 * from here rather than the store directly.
 *
 * React Query dedupes callers that share the query key, so multiple components
 * using this (sidebar, route guard, …) only trigger one network request.
 */
export function useLiveUser() {
  const storeUser = useAuthStore((s) => s.user)
  const token = getCookie('accessToken')

  const { data: meData, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!token,
    staleTime: 60_000,
  })

  const live = meData?.data

  // Backend raw queries may return JSON columns as strings — normalize.
  const livePerms: string[] | null = (() => {
    const raw = live?.permissions
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : null
      } catch {
        return null
      }
    }
    return null
  })()

  const user = live
    ? {
        ...(storeUser ?? {}),
        ...live,
        permissions: livePerms ?? storeUser?.permissions ?? [],
        userType: live?.userType ?? storeUser?.userType ?? null,
        hide_subscription_info: live?.hide_subscription_info,
      }
    : storeUser

  return {
    user,
    storeUser,
    liveHide: live?.hide_subscription_info,
    // True while we wait for the authoritative /auth/me response (e.g. right
    // after a hard refresh, before permissions are resolved). Access guards
    // should render a placeholder during this window instead of acting on the
    // (possibly stale) cached cookie user, which would otherwise flash a wrong
    // "Access denied" before the live data arrives.
    loading: !!token && isLoading,
  }
}
