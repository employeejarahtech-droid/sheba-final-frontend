/**
 * Landing Header — Sticky public navigation bar
 *
 * Adapted from: core-distribute-ronju → hms-frontend/src/components/landing/header.tsx
 *
 * Purple theme, backdrop blur, Sign In / Get Started buttons.
 */

import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X, Hospital } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { to: '/' as const, label: 'Home' },
  { to: '/pricing' as const, label: 'Pricing' },
  { to: '/contact' as const, label: 'Contact' },
]

export function PlatformHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Hospital className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-purple-600">Sheba</span>{' '}
            <span className="text-foreground">HMS</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-purple-600 transition-colors font-medium"
              activeOptions={{ exact: link.to === '/' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/register">Get Started</Link>
          </Button>
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
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-purple-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
