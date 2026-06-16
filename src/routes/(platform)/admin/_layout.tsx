/**
 * Admin Layout — Protected layout for all admin pages
 *
 * Checks adminAccessToken in beforeLoad, redirects to /admin/login if missing.
 * Renders SidebarProvider + AdminSidebar + Outlet (mirrors AuthenticatedLayout).
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/platform/admin-sidebar'
import { usePlatformAuthStore } from '@/stores/platform-auth-store'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export const Route = createFileRoute('/(platform)/admin/_layout')({
  beforeLoad: () => {
    const token = getCookie('adminAccessToken')
    if (!token) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user, logout } = usePlatformAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset
        className={cn(
          '@container/content',
          'has-data-[layout=fixed]:h-svh',
          'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
        )}
      >
        {/* Admin Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Platform Admin</h2>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
                <Badge>{user.role}</Badge>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {children}
    </span>
  )
}
