import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Tenant subdomain home page (e.g. sheba.lvh.me/).
 *
 * Shown at the root once a user is authenticated — a lightweight branded
 * welcome screen with quick links to the dashboard and sign-out. Logged-out
 * visitors see the login page instead (handled in routes/index.tsx).
 */
export function TenantHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [companyName, setCompanyName] = useState<string>('HMS')
  const [logo, setLogo] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/company-settings/public`)
        if (!res.ok) return
        const response = await res.json()
        if (response.data?.company_name) setCompanyName(response.data.company_name)

        let logoUrl = response.data?.company_logo || null
        if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
          logoUrl = `${import.meta.env.VITE_API_URL || ''}${logoUrl}`
        }
        setLogo(logoUrl)
      } catch (error) {
        console.error('Failed to fetch company settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const firstLetter = companyName.charAt(0).toUpperCase()

  const handleSignOut = () => {
    logout()
    // Reactive auth store re-renders the root to the login page.
    navigate({ to: '/', replace: true })
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border bg-card/80 p-8 text-center shadow-xl backdrop-blur-sm sm:p-10">
        {/* Logo */}
        {logo ? (
          <img
            src={logo}
            alt={`${companyName} logo`}
            className="mx-auto h-20 w-20 rounded-2xl border bg-white object-contain p-2 shadow-sm"
          />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <span className="text-3xl font-bold text-white">{firstLetter}</span>
          </div>
        )}

        <h1 className="mt-6 text-2xl font-bold tracking-tight">{companyName}</h1>
        <p className="text-sm text-muted-foreground">Hospital Management System</p>

        <div className="my-6 h-px bg-border" />

        <p className="text-lg font-medium">
          Welcome back{user?.name ? `, ${user.name}` : ''} 👋
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You're signed in. Continue to your dashboard or sign out below.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <p className="relative mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </div>
  )
}
