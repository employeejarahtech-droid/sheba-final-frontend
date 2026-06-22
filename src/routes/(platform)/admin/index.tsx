/**
 * Admin Dashboard — Platform overview ported from the core-distribute-ronju
 * reference. Uses the purple-gradient visual pattern from companies.tsx.
 *
 * Features:
 *   - Gradient stat cards (companies / subscriptions / revenue / registrations)
 *   - Companies-by-status breakdown table (from useDashboardStats)
 *   - Recent registrations table with pagination + status pills
 *   - Expiring subscriptions table with urgency pills (from useSubscriptions)
 *   - Recent companies table with pagination (from useCompanies)
 *
 * Data comes exclusively from @/hooks/usePlatformAdmin — no axios or
 * old-project imports.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Building2,
  CreditCard,
  DollarSign,
  ClipboardList,
  Loader2,
  Clock,
  CalendarClock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getPageNumbers } from '@/lib/utils'
import {
  useDashboardStats,
  useRegistrations,
  useSubscriptions,
  useCompanies,
} from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/')({
  component: AdminDashboard,
})

// ── Local types for table rows ──────────────────────────────────────────

interface RegistrationRow {
  id: number
  company_name?: string
  name?: string
  email?: string
  subdomain?: string
  plan_name?: string
  status?: string
  created_at?: string
}

interface SubscriptionRow {
  id: number
  name?: string
  email?: string | null
  subdomain?: string
  plan_name?: string
  subscription_status?: string
  subscription_expires_at?: string | null
  created_at?: string
}

interface CompanyRow {
  id: number
  name?: string
  email?: string
  subdomain?: string
  plan_name?: string
  subscription_status?: string
  is_active?: boolean
  created_at?: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Status color / label maps ───────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-amber-500',
  expired: 'bg-red-500',
  canceled: 'bg-gray-400',
  unpaid: 'bg-red-500',
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  completed: 'bg-blue-500',
}

const statusLabelMap: Record<string, string> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST DUE',
  expired: 'EXPIRED',
  canceled: 'CANCELED',
  unpaid: 'UNPAID',
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED',
}

// ── Reusable pagination controls ────────────────────────────────────────

function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  accentColor = 'bg-purple-600',
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (p: number) => void
  accentColor?: string
}) {
  if (total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <div className="text-xs text-muted-foreground">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{' '}
        {total}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {getPageNumbers(page, totalPages).map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs text-muted-foreground"
                >
                  ...
                </span>
              )
            }
            const isActive = pageNum === page
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={cn(
                  'h-8 min-w-[32px] rounded-md px-3 text-xs font-medium transition-colors',
                  isActive
                    ? `${accentColor} text-white hover:opacity-90`
                    : 'border border-input hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Reusable per-page selector ──────────────────────────────────────────

function PerPageSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Per page:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-input px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {[10, 20, 30, 50].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────

function SectionHeader({
  icon,
  gradient,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode
  gradient: string
  title: string
  subtitle: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'rounded-lg p-2 shadow-lg bg-gradient-to-br',
            gradient
          )}
        >
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  Admin Dashboard Component
// ═══════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const navigate = useNavigate()

  // Dashboard aggregate stats
  const { data: statsData, isLoading } = useDashboardStats()
  const dashboard = statsData as
    | {
        companies?: {
          total?: number
          active?: number
          inactive?: number
          byStatus?: Record<string, number>
          byDbType?: Record<string, number>
        }
        activePlans?: number
        registrations?: {
          total?: number | string
          pending?: number | string
          approved?: number | string
          rejected?: number | string
        }
        billing?: {
          totalRevenue?: string
          monthlyRevenue?: string
          activeSubscriptions?: number
          pendingInvoices?: number
          totalCompanies?: number
        }
        platform?: { name?: string; version?: string; tenantLabel?: string }
      }
    | undefined

  // Recent registrations (paginated)
  const [regPage, setRegPage] = useState(1)
  const [regLimit, setRegLimit] = useState(10)
  const { data: regData, isLoading: regLoading } = useRegistrations({
    page: regPage,
    limit: regLimit,
  })
  const regItems: RegistrationRow[] =
    (regData?.data as unknown as RegistrationRow[] | undefined) ?? []
  const regPagination: PaginationMeta =
    (regData?.pagination as PaginationMeta | undefined) ?? {
      page: 1,
      limit: regLimit,
      total: 0,
      totalPages: 0,
    }
  const regTotalPages = regPagination.totalPages || 1
  const regTotal = regPagination.total || 0

  // Expiring subscriptions (paginated)
  const [expPage, setExpPage] = useState(1)
  const [expLimit, setExpLimit] = useState(10)
  const { data: expData, isLoading: expLoading } = useSubscriptions({
    page: expPage,
    limit: expLimit,
    status: 'past_due',
  })
  const expItems: SubscriptionRow[] =
    (expData?.data as unknown as SubscriptionRow[] | undefined) ?? []
  const expPagination: PaginationMeta =
    (expData?.pagination as PaginationMeta | undefined) ?? {
      page: 1,
      limit: expLimit,
      total: 0,
      totalPages: 0,
    }
  const expTotalPages = expPagination.totalPages || 1
  const expTotal = expPagination.total || 0

  // Recent companies (paginated)
  const [recentPage, setRecentPage] = useState(1)
  const [recentLimit, setRecentLimit] = useState(10)
  const { data: recentData, isLoading: recentLoading } = useCompanies({
    page: recentPage,
    limit: recentLimit,
  })
  const recentCompanies: CompanyRow[] =
    (recentData?.data as unknown as CompanyRow[] | undefined) ??
    (recentData as unknown as { items?: CompanyRow[] } | undefined)?.items ??
    []
  const recentMeta =
    (recentData?.pagination as PaginationMeta | undefined) ??
    (recentData as unknown as { meta?: PaginationMeta } | undefined)?.meta ?? {
      page: 1,
      limit: recentLimit,
      total: 0,
      totalPages: 0,
    }
  const recentTotalPages = recentMeta.totalPages || 1
  const recentTotal = recentMeta.total || 0

  // Stats cards
  const statsCards = useMemo(
    () => [
      {
        label: 'Total Companies',
        value: dashboard?.companies?.total ?? 0,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Building2 className="h-6 w-6 text-white" />,
      },
      {
        label: 'Active Subscriptions',
        value: dashboard?.billing?.activeSubscriptions ?? 0,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CreditCard className="h-6 w-6 text-white" />,
      },
      {
        label: 'Monthly Revenue',
        value: `$${Number(dashboard?.billing?.monthlyRevenue ?? 0).toLocaleString()}`,
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <DollarSign className="h-6 w-6 text-white" />,
        isText: true,
      },
      {
        label: 'Pending Registrations',
        value: Number(dashboard?.registrations?.pending ?? 0),
        gradient: 'from-amber-600 to-amber-400',
        shadow: 'shadow-amber-500/30',
        icon: <ClipboardList className="h-6 w-6 text-white" />,
      },
      {
        label: 'Inactive Companies',
        value: dashboard?.companies?.inactive ?? 0,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="h-6 w-6 text-white" />,
      },
      {
        label: 'Pending Invoices',
        value: dashboard?.billing?.pendingInvoices ?? 0,
        gradient: 'from-cyan-600 to-cyan-400',
        shadow: 'shadow-cyan-500/30',
        icon: <Clock className="h-6 w-6 text-white" />,
      },
    ],
    [dashboard]
  )

  const byStatusEntries = useMemo(() => {
    const entries = Object.entries(dashboard?.companies?.byStatus ?? {})
    return entries.filter(([, count]) => Number(count) > 0)
  }, [dashboard])

  return (
    <div className="space-y-6">
      {/* ── Page Header (purple gradient card, matches companies.tsx) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Platform Dashboard
              </h1>
              <p className="text-sm text-white/80">
                {dashboard?.platform?.name || 'Platform'} overview
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-white/30 bg-white/20 text-white backdrop-blur-sm"
          >
            <Zap className="mr-1 h-3 w-3" />
            Admin
          </Badge>
        </div>
      </div>

      {/* ── Gradient Stat Cards ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg transition-all duration-300 hover:translate-y-[-2px] hover:scale-[1.02]',
              item.gradient,
              item.shadow
            )}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">
                  {item.label}
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    item.value || (item.isText ? '$0' : 0)
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

      {/* ── Companies by Status ── */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none transition-all duration-300">
        <CardHeader className="gap-0 border-b bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-1.5 dark:from-indigo-950/30 dark:to-violet-950/30">
          <SectionHeader
            icon={<Building2 className="h-4 w-4 text-white" />}
            gradient="from-indigo-500 to-violet-500"
            title="Companies by Status"
            subtitle="All companies grouped by subscription status"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : byStatusEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      No companies yet
                    </td>
                  </tr>
                ) : (
                  byStatusEntries.map(([status, count]) => (
                    <tr
                      key={status}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                            statusColorMap[status] || 'bg-gray-500'
                          )}
                        >
                          {statusLabelMap[status] || status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium">{count}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Registrations ── */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none transition-all duration-300">
        <CardHeader className="gap-0 border-b bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-1.5 dark:from-purple-950/30 dark:to-pink-950/30">
          <SectionHeader
            icon={<ClipboardList className="h-4 w-4 text-white" />}
            gradient="from-purple-500 to-pink-500"
            title="Recent Registrations"
            subtitle="Company registration requests"
            right={
              <>
                <PerPageSelect
                  value={regLimit}
                  onChange={(v) => {
                    setRegLimit(v)
                    setRegPage(1)
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-purple-600 hover:text-purple-700"
                  onClick={() =>
                    navigate({ to: '/admin/registrations' } as never)
                  }
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </>
            }
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Admin Name
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Subdomain
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {regLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : regItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  regItems.map((reg) => (
                    <tr
                      key={reg.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium">
                          {reg.company_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm">{reg.name || '—'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">
                          {reg.email || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm text-blue-600">
                          {reg.subdomain || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm">
                          {reg.plan_name || 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                            statusColorMap[reg.status || ''] || 'bg-gray-500'
                          )}
                        >
                          {statusLabelMap[reg.status || ''] ||
                            reg.status?.toUpperCase() ||
                            '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {reg.created_at
                            ? new Date(reg.created_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={regPage}
            totalPages={regTotalPages}
            total={regTotal}
            limit={regLimit}
            onPageChange={setRegPage}
            accentColor="bg-purple-600"
          />
        </CardContent>
      </Card>

      {/* ── Expiring Subscriptions ── */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none transition-all duration-300">
        <CardHeader className="gap-0 border-b bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-1.5 dark:from-amber-950/30 dark:to-orange-950/30">
          <SectionHeader
            icon={<CalendarClock className="h-4 w-4 text-white" />}
            gradient="from-amber-500 to-orange-500"
            title="Expiring & Past Due"
            subtitle="Subscriptions requiring renewal attention"
            right={
              <>
                <PerPageSelect
                  value={expLimit}
                  onChange={(v) => {
                    setExpLimit(v)
                    setExpPage(1)
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-amber-600 hover:text-amber-700"
                  onClick={() =>
                    navigate({ to: '/admin/subscriptions' } as never)
                  }
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </>
            }
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Subdomain
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Expires
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Urgency
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {expLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : expItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                      No subscriptions expiring soon
                    </td>
                  </tr>
                ) : (
                  expItems.map((sub) => {
                    const expiresAt = sub.subscription_expires_at
                      ? new Date(sub.subscription_expires_at)
                      : null
                    const now = new Date()
                    const diffDays = expiresAt
                      ? Math.ceil(
                          (expiresAt.getTime() - now.getTime()) / 86400000
                        )
                      : null
                    let urgencyColor = 'text-muted-foreground'
                    let urgencyBg = ''
                    let urgencyLabel = '—'
                    let urgent = false
                    if (diffDays !== null) {
                      if (diffDays <= 3) {
                        urgencyColor = 'text-red-600'
                        urgencyBg = 'bg-red-50 dark:bg-red-950/30'
                        urgencyLabel = `${diffDays}d left`
                        urgent = true
                      } else if (diffDays <= 7) {
                        urgencyColor = 'text-amber-600'
                        urgencyBg = 'bg-amber-50 dark:bg-amber-950/30'
                        urgencyLabel = `${diffDays}d left`
                        urgent = true
                      } else {
                        urgencyColor = 'text-blue-600'
                        urgencyBg = 'bg-blue-50 dark:bg-blue-950/30'
                        urgencyLabel = `${diffDays}d left`
                      }
                    }
                    return (
                      <tr
                        key={sub.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium">
                            {sub.name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-sm text-blue-600">
                            {sub.subdomain || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm">
                            {sub.plan_name || 'Free'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                              statusColorMap[
                                sub.subscription_status || ''
                              ] || 'bg-gray-500'
                            )}
                          >
                            {statusLabelMap[sub.subscription_status || ''] ||
                              sub.subscription_status?.toUpperCase() ||
                              '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            {expiresAt ? expiresAt.toLocaleDateString() : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              urgencyBg,
                              urgencyColor
                            )}
                          >
                            {urgent && (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            )}
                            {urgencyLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            {sub.created_at
                              ? new Date(sub.created_at).toLocaleDateString()
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={expPage}
            totalPages={expTotalPages}
            total={expTotal}
            limit={expLimit}
            onPageChange={setExpPage}
            accentColor="bg-amber-600"
          />
        </CardContent>
      </Card>

      {/* ── Recent Companies ── */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none transition-all duration-300">
        <CardHeader className="gap-0 border-b bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-1.5 dark:from-emerald-950/30 dark:to-teal-950/30">
          <SectionHeader
            icon={<Building2 className="h-4 w-4 text-white" />}
            gradient="from-emerald-500 to-teal-500"
            title="Recent Companies"
            subtitle="Newest tenants on the platform"
            right={
              <>
                <PerPageSelect
                  value={recentLimit}
                  onChange={(v) => {
                    setRecentLimit(v)
                    setRecentPage(1)
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-emerald-600 hover:text-emerald-700"
                  onClick={() => navigate({ to: '/admin/companies' } as never)}
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </>
            }
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Subdomain
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : recentCompanies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      No recent companies
                    </td>
                  </tr>
                ) : (
                  recentCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium">
                          {company.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">
                          {company.email || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm text-blue-600">
                          {company.subdomain || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm">
                          {company.plan_name || 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                            statusColorMap[
                              company.subscription_status || ''
                            ] || 'bg-gray-500'
                          )}
                        >
                          {statusLabelMap[
                            company.subscription_status || ''
                          ] ||
                            company.subscription_status?.toUpperCase() ||
                            '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {company.created_at
                            ? new Date(company.created_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={recentPage}
            totalPages={recentTotalPages}
            total={recentTotal}
            limit={recentLimit}
            onPageChange={setRecentPage}
            accentColor="bg-emerald-600"
          />
        </CardContent>
      </Card>
    </div>
  )
}
