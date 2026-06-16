import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="relative container px-4 py-20 md:py-28 mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium bg-white/15 text-white border-white/20 hover:bg-white/20"
          >
            <Sparkles className="size-3.5 mr-1" />
            Built for modern healthcare
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            The All-in-One{' '}
            <span className="text-purple-200">Hospital Management</span>{' '}
            Platform
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage patients, billing, pathology, payroll, inventory, and
            more &mdash; all in one powerful platform. Get started in
            minutes, scale effortlessly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-purple-700 hover:bg-white/90 font-semibold text-base px-8 h-12"
            >
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold text-base px-8 h-12"
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Mockup Placeholder */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="rounded-2xl shadow-2xl bg-muted border border-white/10 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {['Patients', 'Revenue', 'Appointments', 'Reports'].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-lg bg-background p-4 shadow-sm"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {label}
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {label === 'Patients' && '2,450'}
                        {label === 'Revenue' && '$84.5K'}
                        {label === 'Appointments' && '384'}
                        {label === 'Reports' && '126'}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">
                        +12.5% from last month
                      </div>
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {/* Chart placeholder */}
                <div className="col-span-2 rounded-lg bg-background p-4 shadow-sm h-48 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    Hospital Analytics Dashboard
                  </span>
                </div>
                {/* Side panel placeholder */}
                <div className="rounded-lg bg-background p-4 shadow-sm h-48 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    Recent Activity
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
