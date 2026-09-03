/**
 * Features Page — Full overview of every module, feature, and facility.
 *
 * Marketing page wrapped in the home LandingPageWrapper (header + footer) and
 * styled with the Sheba blue brand. Content mirrors the actual modules shipped
 * in the dashboard (see components/layout/data/sidebar-data.ts).
 */

import { createFileRoute } from '@tanstack/react-router'
import {
  Sparkles,
  Check,
  Stethoscope,
  BedDouble,
  TestTube2,
  Activity,
  HandCoins,
  Landmark,
  Wallet,
  Package,
  BarChart3,
  ShieldCheck,
  Building2,
  Lock,
  Globe,
  Database,
  CreditCard,
  Bell,
  Printer,
  Coins,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { CtaSection } from '@/components/landing/cta-section'
import { usePageSeo } from '@/lib/seo'

export const Route = createFileRoute('/(platform)/features')({
  component: FeaturesPage,
})

const modules = [
  {
    icon: Stethoscope,
    title: 'Outdoor & Reception',
    description:
      'Run your diagnostic and OPD front desk end to end — from test catalog to collections.',
    features: [
      'Test catalog, departments & categories',
      'Doctor & referrer management',
      'Diagnostic machines & sample rooms',
      'Invoice creation & due/paid tracking',
      'User-wise & referrer-wise collections',
    ],
  },
  {
    icon: BedDouble,
    title: 'Indoor & Admission',
    description:
      'Manage the complete in-patient journey, from admission to discharge and final billing.',
    features: [
      'Patient admission lifecycle',
      'Ward, bed & cabin management',
      'Service & operation catalog',
      'Bill creation & distribution',
      'Surgeon, anesthesia & assistant billing',
      'Discharge with due/paid tracking',
    ],
  },
  {
    icon: TestTube2,
    title: 'Pathology & Laboratory',
    description:
      'A complete lab information system covering every major department and panel.',
    features: [
      'Biochemistry & lipid profile',
      'Hematology — CBC, PBF, TC/DC, BT/CT',
      'Immunology — Widal, Blood Group, Beta-hCG',
      'Urine, Stool & Hormone panels',
      'Sample tracking & status',
      'Auto report generation & printing',
    ],
  },
  {
    icon: Activity,
    title: 'Diagnostics & Imaging',
    description:
      'Templated reporting for imaging and cardiac investigations with print-ready output.',
    features: [
      'X-Ray reporting',
      'Ultrasonogram reports',
      'ECG reports',
      'Templated result entry & printing',
    ],
  },
  {
    icon: HandCoins,
    title: 'Accounting & Finance',
    description:
      'Double-entry accounting built in — no separate finance software required.',
    features: [
      'Chart of accounts & journals',
      'Ledger & trial balance',
      'Profit & loss and balance sheet',
      'Cash flow statements',
      'Income & expense tracking',
    ],
  },
  {
    icon: Landmark,
    title: 'Banking & Payments',
    description:
      'Track every bank movement and accept payments online and at the counter.',
    features: [
      'Bank accounts & transactions',
      'Deposits & withdrawals',
      'Payment processing & history',
      'Reconciliation',
      'Online gateways (Stripe, SSLCommerz)',
    ],
  },
  {
    icon: Wallet,
    title: 'Payroll & HR',
    description:
      'Manage your workforce, attendance and salaries from one place.',
    features: [
      'Employee management',
      'Attendance tracking',
      'Salary structures',
      'Payroll runs',
      'Leave management',
    ],
  },
  {
    icon: Package,
    title: 'Inventory & Procurement',
    description:
      'Control assets and the full purchase cycle with supplier insights.',
    features: [
      'Asset register & categories',
      'Maintenance & depreciation',
      'Purchase requests & approvals',
      'Goods receipt notes',
      'Supplier management & performance',
    ],
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description:
      'Decision-ready dashboards and dozens of print-ready operational reports.',
    features: [
      'Patient & bed-occupancy reports',
      'Revenue & collection analytics',
      'Pathology & machine utilization',
      'Accounting statements',
      'HR, payroll & inventory reports',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Administration & Security',
    description:
      'Granular control over users, configuration and your hospital’s data.',
    features: [
      'Role-based access control',
      'User & role management',
      'Configurable app & report settings',
      'Database browser & backups',
      'Notifications & in-app chat',
    ],
  },
]

const facilities = [
  {
    icon: Building2,
    title: 'Multi-Tenant Architecture',
    description: 'Run multiple hospitals from one platform, each fully separated.',
  },
  {
    icon: Database,
    title: 'Dedicated Encrypted Database',
    description: 'Every hospital gets its own isolated, encrypted database.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access Control',
    description: 'Fine-grained permissions for every role and user.',
  },
  {
    icon: Globe,
    title: 'Custom Subdomain',
    description: 'A branded hospital.yourdomain address for each tenant.',
  },
  {
    icon: CreditCard,
    title: 'Online Payments',
    description: 'Stripe and SSLCommerz — cards, bKash, Nagad & Rocket.',
  },
  {
    icon: Coins,
    title: 'Multi-Currency Support',
    description: 'Country and currency configuration out of the box.',
  },
  {
    icon: Bell,
    title: 'Notifications & Chat',
    description: 'Real-time alerts and built-in team messaging.',
  },
  {
    icon: Printer,
    title: 'Print-Ready Documents',
    description: 'Professional invoices, lab reports and statements.',
  },
]

function FeaturesPage() {
  usePageSeo({
    title: 'Features — Hospital Management Software Modules | HMS',
    description:
      'Explore every HMS module: admissions & indoor care, pathology & laboratory, diagnostics, accounting, payroll, inventory, reporting and role-based security — all in one hospital management software.',
    path: '/features',
  })

  return (
    <LandingPageWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center md:py-24">
          <Badge
            variant="secondary"
            className="mb-5 border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            <Sparkles className="mr-2 size-3.5 text-blue-500" />
            Platform features
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Everything your hospital needs,{' '}
            <span className="text-blue-600">in one platform</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            From admissions and pathology to accounting, payroll and inventory —
            Sheba HMS replaces a patchwork of disconnected tools with a single,
            secure system for your entire facility.
          </p>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Complete modules for every department
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              Clinical, financial and administrative tools that work together
              seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.title}
                className="group flex flex-col border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div className="mb-5 inline-flex w-fit items-center justify-center rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:ring-blue-600">
                    <module.icon className="size-6 text-blue-600 transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-slate-600">
                    {module.description}
                  </p>
                  <ul className="mt-auto space-y-2.5">
                    {module.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-blue-600" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities / Platform capabilities */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Built-in platform facilities
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              Enterprise-grade capabilities included with every plan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((facility) => (
              <div
                key={facility.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-2.5 ring-1 ring-blue-100">
                  <facility.icon className="size-5 text-blue-600" />
                </div>
                <h3 className="mb-1.5 font-semibold text-slate-900">
                  {facility.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <CtaSection />
    </LandingPageWrapper>
  )
}
