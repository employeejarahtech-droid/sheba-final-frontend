import { useLiveUser } from '@/hooks/use-live-user'
import { hasPermission } from '@/lib/permissions'

/**
 * Returns a `can(permission)` checker for the current user. Use it to show/hide
 * action controls (create/edit/delete) by permission.
 *
 *   const can = useCan()
 *   {can('users.create') && <AddUserButton />}
 *
 * Reads the live /auth/me user (via useLiveUser) so action-button visibility
 * stays consistent with the sidebar and route guard — a role's permissions can
 * change after the user last logged in, and the cached cookie user would be
 * stale. React Query dedupes the shared key, so many callers = one request.
 *
 * Admins and roles with no permissions configured are unrestricted (see
 * lib/permissions). Accepts a single permission or an array (any-of).
 */
export function useCan() {
  const { user } = useLiveUser()
  return (permission: string | string[]): boolean => {
    const list = Array.isArray(permission) ? permission : [permission]
    return list.some((p) => hasPermission(user, p))
  }
}
