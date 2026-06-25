/**
 * Company Detail Page — Full profile for a single platform company/tenant
 *
 * Route: /(platform)/admin/companies/$companyId
 * Features: company info card, subscription info card, active toggle,
 * Back link to /admin/companies. Uses useCompany + useSubscription
 * (both return unwrapped entities) from @/hooks/usePlatformAdmin.
 */

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Building2,
  ArrowLeft,
  Mail,
  Globe,
  Database,
  Activity,
  Loader2,
  CreditCard,
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCompany,
  useSubscription,
  useToggleCompanyActive,
} from '@/hooks/usePlatformAdmin'
import type { PlatformCompany, PlatformSubscription } from '@/types/platform.types'
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'

export const Route = createFileRoute('/(platform)/admin/companies/$companyId')({
  beforeLoad: () => {
    // Companies management is restricted to super admins (backend enforces too)
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: CompanyDetailPage,
})

// ── Status Color Map ────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-amber-500',
  expired: 'bg-red-500',
  canceled: 'bg-gray-400',
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  unpaid: 'bg-red-500',
}

// ── Helpers ─────────────────────────────────────────────────────────────

const fmtDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

const fmtDateTime = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

const orDash = (value: string | null | undefined): string =>
  value && value.trim() !== '' ? value : '—'

// ── Component ───────────────────────────────────────────────────────────

function CompanyDetailPage() {
  const { companyId } = Route.useParams()
  const id = Number(companyId)

  const { data: company, isLoading: companyLoading } = useCompany(id)
  const { data: subscription, isLoading: subLoading } = useSubscription(id)
  const toggleActive = useToggleCompanyActive()

  const isLoading = companyLoading || subLoading
  const active = Boolean(company?.is_active)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Activity className="h-6 w-6 animate-pulse text-purple-500" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            Company not found.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <p className="text-sm text-white/80">
                Tenant detail &amp; subscription overview
              </p>
            </div>
          </div>
          <Button
            onClick={() => toggleActive.mutate(company.id)}
            disabled={toggleActive.isPending}
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            {toggleActive.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : active ? (
              <ToggleRight className="h-4 w-4 mr-2" />
            ) : (
              <ToggleLeft className="h-4 w-4 mr-2" />
            )}
            {active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Company Info</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={orDash(company.email)} />
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Subdomain" value={orDash(company.subdomain)} />
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Domain" value={orDash(company.domain)} />
            <DetailRow icon={<Database className="h-4 w-4" />} label="DB Name" value={orDash(company.db_name)} />
            <DetailRow icon={<Database className="h-4 w-4" />} label="DB Type" value={company.db_type} />
            <DetailRow
              icon={<Activity className="h-4 w-4" />}
              label="Active"
              value={
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                    active ? 'bg-emerald-500' : 'bg-gray-400'
                  )}
                >
                  {active ? 'Active' : 'Inactive'}
                </span>
              }
            />
          </dl>
        </section>

        {/* Subscription Info */}
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold">Subscription</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow
              icon={<Activity className="h-4 w-4" />}
              label="Status"
              value={
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                    statusColorMap[company.subscription_status || ''] ||
                      'bg-gray-400'
                  )}
                >
                  {company.subscription_status || 'none'}
                </span>
              }
            />
            <DetailRow
              icon={<Hash className="h-4 w-4" />}
              label="Plan"
              value={orDash(company.plan_name ?? subscription?.plan_name) || '—'}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Expires"
              value={fmtDate(
                company.subscription_expires_at ??
                  subscription?.subscription_expires_at
              )}
            />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Stripe Customer"
              value={
                <span className="font-mono text-xs">
                  {orDash(company.stripe_customer_id)}
                </span>
              }
            />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Stripe Subscription"
              value={
                <span className="font-mono text-xs">
                  {orDash(
                    company.stripe_subscription_id ??
                      subscription?.stripe_subscription_id
                  )}
                </span>
              }
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Created"
              value={fmtDateTime(company.created_at)}
            />
          </dl>
        </section>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function BackLink() {
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link to="/admin/companies">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Link>
      </Button>
    </div>
  )
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span className="text-purple-400">{icon}</span>
        {label}
      </dt>
      <dd className="font-medium text-right break-all">{value}</dd>
    </div>
  )
}
