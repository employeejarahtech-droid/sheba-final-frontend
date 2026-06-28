import { useAuthStore } from '@/stores/auth-store'
import { hasPermission } from '@/lib/permissions'

/**
 * Returns a `can(permission)` checker for the current user. Use it to show/hide
 * action controls (create/edit/delete) by permission.
 *
 *   const can = useCan()
 *   {can('users.create') && <AddUserButton />}
 *
 * Admins and roles with no permissions configured are unrestricted (see
 * lib/permissions). Accepts a single permission or an array (any-of).
 */
export function useCan() {
  const user = useAuthStore((s) => s.user)
  return (permission: string | string[]): boolean => {
    const list = Array.isArray(permission) ? permission : [permission]
    return list.some((p) => hasPermission(user, p))
  }
}
