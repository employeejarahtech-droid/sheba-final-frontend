import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-100 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      <div className="relative container px-4 py-20 md:py-28 mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Sparkles className="size-3.5 mr-2 text-blue-500" />
            Built for modern healthcare
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Next-Generation <span className="text-blue-600">Hospital Management</span>. Absolute Patient Data Security.
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform for admissions, pathology, and billing. Built on a multi-tenant architecture where every hospital gets its own dedicated, encrypted database. Complete data isolation for absolute peace of mind.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700 font-semibold text-base px-8 h-12 shadow-lg shadow-blue-200"
            >
              <Link to="/register">Schedule a Consultation</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold text-base px-8 h-12 shadow-sm"
            >
              <Link to="/pricing">Explore Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Mockup Placeholder */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="rounded-2xl shadow-2xl bg-white border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
            <div className="p-6 md:p-8 bg-slate-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['Daily Admissions', 'Pathology Reports', 'Billing Summaries', 'Active Staff'].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white border border-slate-100 p-5 shadow-sm"
                    >
                      <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                        {label}
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {label === 'Daily Admissions' && '142'}
                        {label === 'Pathology Reports' && '84'}
                        {label === 'Billing Summaries' && '$24.5K'}
                        {label === 'Active Staff' && '67'}
                      </div>
                      <div className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live tracking active
                      </div>
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chart placeholder */}
                <div className="col-span-1 md:col-span-2 rounded-xl bg-white border border-slate-100 p-6 shadow-sm h-64 flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 mb-4">
                    Hospital Occupancy & Admissions
                  </span>
                  <div className="flex-1 flex items-end gap-2 mt-4">
                    {/* Simulated bar chart */}
                    {[40, 60, 45, 80, 50, 70, 90].map((height, i) => (
                      <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{ height: `${height}%` }}>
                        <div className="bg-blue-600 w-full rounded-t-sm transition-all" style={{ height: `${height * 0.7}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Side panel placeholder */}
                <div className="rounded-xl bg-white border border-slate-100 p-6 shadow-sm h-64 flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 mb-4">
                    Recent Pathology Results
                  </span>
                  <div className="space-y-3 flex-1 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="size-8 rounded bg-teal-100 flex items-center justify-center shrink-0">
                          <span className="text-xs text-teal-700 font-bold">CBC</span>
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-medium text-slate-800">Patient #{1000 + i}</div>
                          <div className="text-xs text-slate-500 truncate">Peripheral Blood Film - Completed</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
