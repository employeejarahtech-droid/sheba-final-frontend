import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { canAccessPath } from '@/lib/permissions'

/**
 * Blocks pages the current user's role isn't permitted to view. Admins and
 * roles with no permissions configured are never blocked (see lib/permissions).
 * Pages with no known permission are left accessible.
 */
export function PermissionGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const pathname = useLocation({ select: (l) => l.pathname })

  if (canAccessPath(user, pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        You don't have permission to view this page. If you believe this is a
        mistake, contact your administrator to update your role.
      </p>
      <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
