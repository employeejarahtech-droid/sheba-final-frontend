/**
 * Stripe Dashboard Page — Stripe-specific customers and subscriptions
 *
 * Route: /(platform)/admin/billing/stripe
 * Features: purple-gradient stat cards, customers table, subscriptions table.
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CreditCard,
  Users,
  DollarSign,
  Loader2,
  Activity,
  ArrowLeft,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useStripeOverview,
  useStripeCustomers,
  useStripeSubscriptions,
} from '@/hooks/usePlatformAdmin'
import type {
  PlatformStripeOverview,
  PlatformStripeCustomer,
  PlatformSubscription,
} from '@/types/platform.types'

export const Route = createFileRoute('/(platform)/admin/billing/stripe')({
  component: StripeDashboardPage,
})

// ── Status maps ───────────────────────────────────────────────────────────

const subStatusColorMap: Record<string, string> = {
  active: 'bg-emerald-500 hover:bg-emerald-600',
  trialing: 'bg-blue-500 hover:bg-blue-600',
  past_due: 'bg-amber-500 hover:bg-amber-600',
  canceled: 'bg-red-500 hover:bg-red-600',
  canceled_alt: 'bg-red-500 hover:bg-red-600',
  incomplete: 'bg-gray-400 hover:bg-gray-500',
  incomplete_expired: 'bg-gray-400 hover:bg-gray-500',
  unpaid: 'bg-red-500 hover:bg-red-600',
}

const subStatusLabelMap: Record<string, string> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST DUE',
  canceled: 'CANCELED',
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE EXPIRED',
  unpaid: 'UNPAID',
}

// ── Helpers ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0
  if (Number.isNaN(num)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num)
}

const formatNumber = (value: number): string => value.toLocaleString()

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────

function StripeDashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useStripeOverview()
  const { data: customers, isLoading: customersLoading } = useStripeCustomers()
  const { data: subscriptions, isLoading: subsLoading } = useStripeSubscriptions()

  const ov = overview as PlatformStripeOverview | undefined
  const customerList = (customers as PlatformStripeCustomer[] | undefined) ?? []
  const subList = (subscriptions as PlatformSubscription[] | undefined) ?? []

  const stats = useMemo(
    () => [
      {
        label: 'Stripe Customers',
        value: overviewLoading ? null : formatNumber(ov?.customers ?? 0),
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <Users className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active Subscriptions',
        value: overviewLoading ? null : formatNumber(ov?.subscriptions ?? 0),
        gradient: 'from-violet-600 to-violet-400',
        shadow: 'shadow-violet-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: 'Stripe Revenue',
        value: overviewLoading ? null : formatCurrency(ov?.revenue ?? 0),
        gradient: 'from-fuchsia-600 to-fuchsia-400',
        shadow: 'shadow-fuchsia-500/30',
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
    ],
    [overviewLoading, ov]
  )

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Stripe Dashboard</h1>
              <p className="text-sm text-white/80">
                Stripe customers, subscriptions, and revenue
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="hidden sm:inline-flex bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/20"
          >
            <Link to="/admin/billing/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Link>
          </Button>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]',
              item.gradient,
              item.shadow
            )}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{item.label}</p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {item.value === null ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    item.value
                  )}
                </h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                {item.icon}
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Stripe Customers</h2>
        </div>

        {customersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="h-6 w-6 animate-pulse text-purple-500" />
          </div>
        ) : customerList.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-purple-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No Stripe customers yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3">Company</TableHead>
                  <TableHead className="px-4 py-3">Email</TableHead>
                  <TableHead className="px-4 py-3">Subdomain</TableHead>
                  <TableHead className="px-4 py-3">Stripe Customer ID</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList.map((c) => {
                  const statusKey = (c.subscription_status ?? '').toLowerCase()
                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-4 py-3 font-medium">
                        {c.name ?? '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {c.email ?? '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <span className="font-mono text-purple-600">
                          {c.subdomain ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground break-all">
                          {c.stripe_customer_id ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {c.subscription_status ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                              subStatusColorMap[statusKey] ?? 'bg-gray-500'
                            )}
                          >
                            {subStatusLabelMap[statusKey] ??
                              statusKey.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Stripe Subscriptions</h2>
        </div>

        {subsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="h-6 w-6 animate-pulse text-purple-500" />
          </div>
        ) : subList.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-purple-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No Stripe subscriptions yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3">Company</TableHead>
                  <TableHead className="px-4 py-3">Plan</TableHead>
                  <TableHead className="px-4 py-3">Subdomain</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subList.map((s) => {
                  const statusKey = (s.subscription_status ?? '').toLowerCase()
                  return (
                    <TableRow
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-4 py-3 font-medium">
                        {s.name ?? '—'}
                        {s.email && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {s.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {s.plan_name ?? '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <span className="font-mono text-purple-600">
                          {s.subdomain ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {s.subscription_status ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                              subStatusColorMap[statusKey] ?? 'bg-gray-500'
                            )}
                          >
                            {subStatusLabelMap[statusKey] ??
                              statusKey.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(s.subscription_expires_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
