/**
 * Platform Layout — wraps all public platform pages
 *
 * PlatformHeader → Outlet → PlatformFooter
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PlatformHeader } from '@/components/platform/platform-header'
import { PlatformFooter } from '@/components/platform/platform-footer'

export const Route = createFileRoute('/(platform)/_layout')({
  component: PlatformLayout,
})

function PlatformLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PlatformHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PlatformFooter />
    </div>
  )
}
