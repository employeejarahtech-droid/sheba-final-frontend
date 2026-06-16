/**
 * Landing Footer — Public footer for platform pages
 *
 * Adapted from: core-distribute-ronju → hms-frontend/src/components/landing/footer.tsx
 *
 * 4-column grid: logo+description, product, company, legal.
 * Purple hover links, muted background.
 */

import { Link } from '@tanstack/react-router'
import { Hospital } from 'lucide-react'

const footerLinks = {
  product: [
    { to: '/pricing' as const, label: 'Pricing' },
    { to: '/' as const, label: 'Features' },
  ],
  company: [
    { to: '/contact' as const, label: 'Contact' },
  ],
  legal: [
    { to: '/' as const, label: 'Privacy Policy' },
    { to: '/' as const, label: 'Terms of Service' },
  ],
}

export function PlatformFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Hospital className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-purple-600">Sheba</span>{' '}
                <span className="text-foreground">HMS</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Complete hospital management system. Patients, billing,
              pathology, payroll and more — all in one platform.
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
                    className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
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
                    className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
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
                    className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
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
          &copy; {currentYear}  HMS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
