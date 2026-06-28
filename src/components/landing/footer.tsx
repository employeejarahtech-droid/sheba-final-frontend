import { Link } from '@tanstack/react-router'

const footerLinks = {
  product: [
    { to: '/features' as const, label: 'Features' },
    { to: '/pricing' as const, label: 'Pricing' },
    { to: '/register' as const, label: 'Get Started' },
    { to: '/login' as const, label: 'Sign In' },
  ],
  company: [
    { to: '/' as const, label: 'Home' },
    { to: '/about' as const, label: 'About' },
    { to: '/contact' as const, label: 'Contact' },
  ],
  legal: [
    { to: '/privacy' as const, label: 'Privacy Policy' },
    { to: '/terms' as const, label: 'Terms of Service' },
  ],
}

export function LandingFooter() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                H
              </div>
              <span className="text-xl font-bold">
                <span className="text-blue-600">H</span>MS
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              A comprehensive hospital management platform designed for modern
              healthcare facilities. Manage your entire operation from a single
              platform.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HMS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
