import { Outlet } from '@tanstack/react-router'
import { LandingHeader } from '@/components/landing/header'
import { LandingFooter } from '@/components/landing/footer'

export function LandingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

export function LandingPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
