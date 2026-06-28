import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { getSubdomainInfo, buildTenantUrl } from '@/lib/subdomain'

const navLinks = [
  { to: '/' as const, label: 'Home' },
  { to: '/pricing' as const, label: 'Pricing' },
  { to: '/about' as const, label: 'About' },
  { to: '/contact' as const, label: 'Contact' },
]

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuthStore()
  const { isCompanyPortal } = getSubdomainInfo()

  // Determine where "Dashboard" button should go:
  // 1. On tenant subdomain + logged in → stay here, go to /dashboard
  // 2. On base domain + logged in tenant user → redirect to their subdomain /dashboard
  // 3. Not logged in or no subdomain → show Sign In / Get Started
  const userSubdomain = user?.subdomain
  const isLoggedIn = !!user

  // Build the dashboard URL
  const getDashboardUrl = () => {
    if (isCompanyPortal) {
      // Already on tenant subdomain → relative link
      return '/dashboard'
    }
    // On base domain → redirect to user's tenant subdomain
    if (userSubdomain) {
      return `${buildTenantUrl(userSubdomain)}/dashboard`
    }
    return '/dashboard'
  }

  const dashboardUrl = getDashboardUrl()
  // Show Dashboard button only when on a tenant subdomain (never on base domain landing page)
  const showDashboard = isLoggedIn && isCompanyPortal
  // For tenant subdomain URLs we need a full page navigation, not a router Link
  const isExternalNavigation = !isCompanyPortal && userSubdomain

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            S
          </div>
          <span className="text-xl font-bold">
            <span className="text-blue-600">Sheba</span> HMS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
              activeOptions={{ exact: link.to === '/' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {showDashboard ? (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              {isExternalNavigation ? (
                <a href={dashboardUrl}>Dashboard</a>
              ) : (
                <Link to="/dashboard">Dashboard</Link>
              )}
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container px-4 py-4 mx-auto space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t space-y-2">
              {showDashboard ? (
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  {isExternalNavigation ? (
                    <a href={dashboardUrl} onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </a>
                  ) : (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
