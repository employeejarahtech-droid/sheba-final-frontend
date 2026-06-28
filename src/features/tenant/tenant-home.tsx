import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Stethoscope,
  TestTube2,
  Activity,
  BedDouble,
  Ambulance,
  Pill,
  HeartPulse,
  Microscope,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Tenant subdomain home page (e.g. sheba.lvh.me/).
 *
 * A minimal, standard hospital landing page rendered at the tenant root. It is
 * branded from the tenant's public company settings (name, logo, contact) and
 * adapts to auth state — "Sign In" when logged out (login lives at /login),
 * "Go to Dashboard" / "Sign out" when authenticated.
 */

interface CompanySettings {
  company_name?: string
  company_logo?: string | null
  company_address?: string
  company_phone?: string
  company_email?: string
}

const services = [
  {
    icon: Stethoscope,
    title: 'Outpatient (OPD)',
    description: 'Consultations and follow-ups across all specialties.',
  },
  {
    icon: TestTube2,
    title: 'Pathology & Laboratory',
    description: 'Accurate lab diagnostics with fast, reliable reporting.',
  },
  {
    icon: Activity,
    title: 'Diagnostics & Imaging',
    description: 'X-Ray, ultrasonogram and ECG with expert reporting.',
  },
  {
    icon: BedDouble,
    title: 'Inpatient & Admission',
    description: 'Comfortable wards and cabins with round-the-clock care.',
  },
  {
    icon: Ambulance,
    title: 'Emergency Care',
    description: '24/7 emergency services for critical situations.',
  },
  {
    icon: Pill,
    title: 'Pharmacy',
    description: 'In-house pharmacy stocked with essential medicines.',
  },
]

const highlights = [
  {
    icon: Stethoscope,
    title: 'Experienced Specialists',
    description: 'A dedicated team of qualified doctors and consultants.',
  },
  {
    icon: Microscope,
    title: 'Modern Diagnostics',
    description: 'Advanced laboratory and imaging technology.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Emergency and critical care, any time of day.',
  },
  {
    icon: HeartPulse,
    title: 'Patient-First Care',
    description: 'Compassionate treatment focused on your wellbeing.',
  },
]

const stats = [
  { value: '150+', label: 'Beds' },
  { value: '50+', label: 'Doctors' },
  { value: '20+', label: 'Departments' },
  { value: '24/7', label: 'Emergency' },
]

export function TenantHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = !!accessToken

  const [settings, setSettings] = useState<CompanySettings>({})

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/company-settings/public`
        )
        if (!res.ok) return
        const response = await res.json()
        const data: CompanySettings = response.data || {}

        let logoUrl = data.company_logo || null
        if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
          logoUrl = `${import.meta.env.VITE_API_URL || ''}${logoUrl}`
        }
        setSettings({ ...data, company_logo: logoUrl })
      } catch (error) {
        console.error('Failed to fetch company settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const companyName = settings.company_name || 'HMS'
  const logo = settings.company_logo || null
  const address = settings.company_address || 'Dhaka, Bangladesh'
  const phone = settings.company_phone || '+880 1XXX-XXXXXX'
  const email = settings.company_email || 'info@hospital.com'
  const firstLetter = companyName.charAt(0).toUpperCase()

  const handleSignOut = () => {
    logout()
    navigate({ to: '/', replace: true })
  }

  const LogoMark = () =>
    logo ? (
      <img
        src={logo}
        alt={`${companyName} logo`}
        className="h-10 w-10 rounded-lg border bg-white object-contain p-1"
      />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
        {firstLetter}
      </div>
    )

  return (
    <div className="flex min-h-svh flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold text-slate-900">{companyName}</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#services" className="text-slate-600 transition-colors hover:text-blue-600">
              Services
            </a>
            <a href="#about" className="text-slate-600 transition-colors hover:text-blue-600">
              Why Us
            </a>
            <a href="#contact" className="text-slate-600 transition-colors hover:text-blue-600">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
            <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
          </div>
          <div className="relative container mx-auto px-4 py-20 text-center md:py-28">
            <div className="mx-auto mb-6 flex items-center justify-center">
              <LogoMark />
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {isAuthenticated && user?.name
                ? `Welcome back, ${user.name}`
                : `Welcome to ${companyName}`}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Compassionate care backed by modern technology. Quality healthcare
              services for you and your family — all in one place.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-blue-600 px-8 hover:bg-blue-700">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-blue-600 px-8 hover:bg-blue-700">
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-blue-200 px-8 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <a href="#services">Explore Services</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-20 bg-white py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Our Services
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
                Comprehensive medical services to meet all your healthcare needs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:ring-blue-600">
                    <service.icon className="size-6 text-blue-600 transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-blue-950 py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-2 text-4xl font-bold text-white md:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-blue-200 md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section id="about" className="scroll-mt-20 bg-slate-50 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Why Choose {companyName}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
                Trusted, patient-focused healthcare you can rely on.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-full bg-blue-50 p-3 ring-1 ring-blue-100">
                    <item.icon className="size-6 text-blue-600" />
                  </div>
                  <h3 className="mb-1.5 font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-20 bg-white py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Get in Touch
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
                  We're here to help. Reach out or visit us any time.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-3 ring-1 ring-blue-100">
                    <MapPin className="size-5 text-blue-600" />
                  </div>
                  <h3 className="mb-1 font-medium text-slate-900">Address</h3>
                  <p className="text-sm text-slate-600">{address}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-3 ring-1 ring-blue-100">
                    <Phone className="size-5 text-blue-600" />
                  </div>
                  <h3 className="mb-1 font-medium text-slate-900">Phone</h3>
                  <p className="text-sm text-slate-600">{phone}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-3 ring-1 ring-blue-100">
                    <Mail className="size-5 text-blue-600" />
                  </div>
                  <h3 className="mb-1 font-medium text-slate-900">Email</h3>
                  <p className="text-sm text-slate-600">{email}</p>
                </div>
              </div>

              {/* Sign-in prompt */}
              <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center sm:flex-row sm:text-left">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Staff Portal</h3>
                    <p className="text-sm text-slate-600">
                      Authorized staff can sign in to access the management
                      dashboard.
                    </p>
                  </div>
                </div>
                {isAuthenticated ? (
                  <Button asChild size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-bold text-slate-900">{companyName}</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Powered by HMS</p>
        </div>
      </footer>
    </div>
  )
}
