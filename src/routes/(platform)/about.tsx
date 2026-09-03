/**
 * About Page — Company story, mission, values and credibility
 *
 * Marketing page wrapped in the home LandingPageWrapper (header + footer) and
 * styled with the Sheba blue brand. Reuses the shared StatsSection and
 * CtaSection for consistency with the landing page.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Sparkles,
  Target,
  Eye,
  HeartPulse,
  ShieldCheck,
  Zap,
  Users,
  Database,
  Lock,
  Check,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { StatsSection } from '@/components/landing/stats-section'
import { CtaSection } from '@/components/landing/cta-section'
import { usePageSeo } from '@/lib/seo'

export const Route = createFileRoute('/(platform)/about')({
  component: AboutPage,
})

const values = [
  {
    icon: HeartPulse,
    title: 'Patient-First',
    description:
      'Every feature we build ultimately serves better patient care and safer clinical outcomes.',
  },
  {
    icon: ShieldCheck,
    title: 'Security by Design',
    description:
      'Data privacy is not an afterthought. Isolation and encryption are built into our foundation.',
  },
  {
    icon: Zap,
    title: 'Reliability',
    description:
      'Hospitals run around the clock, and so does our platform — engineered for critical-care uptime.',
  },
  {
    icon: Users,
    title: 'Partnership',
    description:
      'We grow alongside the hospitals we serve, listening closely and improving continuously.',
  },
]

const differentiators = [
  'Dedicated, encrypted database for every hospital',
  'Complete suite: admissions, pathology, billing, payroll & more',
  'Multi-tenant scalability with single-hospital security',
  'Local payment support including bKash, Nagad & cards',
  'Role-based access with granular permissions',
  'Continuous updates and responsive support',
]

function AboutPage() {
  usePageSeo({
    title: 'About Us — HMS Hospital Management Software',
    description:
      'HMS is an all-in-one hospital management software helping healthcare facilities run admissions, pathology, billing and operations on a secure, multi-tenant platform.',
    path: '/about',
  })

  return (
    <LandingPageWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge
            variant="secondary"
            className="mb-5 border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            <Sparkles className="mr-2 size-3.5 text-blue-500" />
            About HMS
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Building the future of{' '}
            <span className="text-blue-600">hospital management</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 leading-relaxed">
            HMS is an all-in-one platform helping modern healthcare
            facilities run admissions, pathology, billing and operations — on a
            secure, multi-tenant architecture where every hospital gets its own
            dedicated, encrypted database.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardContent className="p-8">
                <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
                  <Target className="size-6 text-blue-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">Our Mission</h2>
                <p className="leading-relaxed text-slate-600">
                  To give every hospital — large or small — enterprise-grade
                  software that simplifies operations, protects patient data, and
                  frees clinical teams to focus on what matters most: care.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-8">
                <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
                  <Eye className="size-6 text-blue-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">Our Vision</h2>
                <p className="leading-relaxed text-slate-600">
                  A connected healthcare ecosystem where data security is the
                  default, technology never gets in the way of treatment, and
                  hospitals everywhere can deliver world-class patient outcomes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats (reused, blue band) */}
      <StatsSection />

      {/* Our Story */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Born from a simple belief:{' '}
                <span className="text-blue-600">
                  patient data deserves better.
                </span>
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Traditional hospital software forced facilities to choose between
                affordable shared systems and expensive, isolated installations.
                We saw hospitals struggling with fragmented tools, slow reporting,
                and real concerns about where their patients' records actually
                lived.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                So we built HMS differently — combining the scalability of
                modern cloud software with the security of a dedicated database
                per hospital. The result is a complete, fast, and trustworthy
                platform that grows with you.
              </p>
            </div>

            {/* Architectural visual */}
            <div className="relative flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-blue-50/50" />
              <div className="relative flex w-full flex-col items-center gap-6">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                  </span>
                  Central Cloud Engine
                </div>
                <div className="mt-4 flex w-full justify-between gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex w-1/3 flex-col items-center gap-3">
                      <div className="h-12 w-px border-l border-dashed bg-slate-300" />
                      <div className="group relative w-full rounded-xl border-2 border-blue-100 bg-white p-4 text-center shadow-sm transition-colors hover:border-blue-300">
                        <Database className="mx-auto mb-2 size-8 text-blue-500 transition-colors group-hover:text-blue-600" />
                        <div className="text-xs font-bold text-slate-700">
                          Hospital {String.fromCharCode(64 + i)}
                        </div>
                        <div className="absolute -top-2 -right-2 rounded-full border border-white bg-teal-100 p-1 text-teal-700">
                          <Lock className="size-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              What we stand for
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              The principles that guide every decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card
                key={value.title}
                className="group border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <CardContent className="pt-6">
                  <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:ring-blue-600">
                    <value.icon className="size-6 text-blue-600 transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why HMS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm md:p-12">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                  Why hospitals choose{' '}
                  <span className="text-blue-600">HMS</span>
                </h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  A single platform that replaces a patchwork of disconnected
                  tools — without compromising on security or performance.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="bg-blue-600 px-8 font-semibold text-white hover:bg-blue-700"
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-blue-200 px-8 font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Link to="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
              <ul className="space-y-4">
                {differentiators.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Check className="size-4" />
                    </span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <CtaSection />
    </LandingPageWrapper>
  )
}
