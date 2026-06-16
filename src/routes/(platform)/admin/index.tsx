/**
 * Admin Dashboard — Platform overview with gradient stat cards
 *
 * Shows stat cards for companies, subscriptions, revenue, registrations.
 * Includes companies by status table and recent registrations table
 * with pagination, matching the core-distribute-ronju reference design.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Building2,
  CreditCard,
  DollarSign,
  ClipboardList,
  TrendingUp,
  XCircle,
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getPageNumbers } from '@/lib/utils'
import { useDashboardStats, useRegistrations } from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/')({
  component: AdminDashboard,
})

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
}

// ── Pagination Controls ─────────────────────────────────────────────────

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
    <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t gap-3">
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
                  'h-8 min-w-[32px] px-3 text-xs font-medium rounded-md transition-colors',
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

// ── Admin Dashboard Component ───────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate()
  const { data: statsData, isLoading } = useDashboardStats()

  // Registrations pagination state
  const [regPage, setRegPage] = useState(1)
  const [regLimit, setRegLimit] = useState(10)

  // Fetch paginated registrations
  const { data: regData, isLoading: regLoading } = useRegistrations({
    page: regPage,
    limit: regLimit,
  })

  const dashboard = statsData as any
  const regItems = regData?.data || []
  const regPagination = regData?.pagination || {}
  const regTotalPages = Math.ceil((regPagination.total || 0) / regLimit)
  const regTotal = regPagination.total || 0

  // Stats cards configuration
  const statsCards = useMemo(
    () => [
      {
        label: 'Total Companies',
        value: dashboard?.companies?.total ?? 0,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Building2 className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active Subscriptions',
        value: dashboard?.billing?.activeSubscriptions ?? 0,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: 'Monthly Revenue',
        value: `$${Number(dashboard?.billing?.monthlyRevenue ?? 0).toLocaleString()}`,
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <DollarSign className="w-6 h-6 text-white" />,
        isText: true,
      },
      {
        label: 'Pending Registrations',
        value: Number(dashboard?.registrations?.pending ?? 0),
        gradient: 'from-amber-600 to-amber-400',
        shadow: 'shadow-amber-500/30',
        icon: <ClipboardList className="w-6 h-6 text-white" />,
      },
      {
        label: 'Trialing',
        value: Number(dashboard?.registrations?.approved ?? 0),
        gradient: 'from-cyan-600 to-cyan-400',
        shadow: 'shadow-cyan-500/30',
        icon: <TrendingUp className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive',
        value: dashboard?.companies?.inactive ?? 0,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ],
    [dashboard]
  )

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Platform Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {dashboard?.platform?.name || 'Platform'} overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Zap className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((item, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
          >
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white opacity-20 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black opacity-20 blur-2xl" />

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
      <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b py-1.5 px-4 gap-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow-lg">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Companies by Status
              </CardTitle>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                All companies grouped by subscription status
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : !dashboard?.companies?.byStatus ||
                  Object.keys(dashboard.companies.byStatus).length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No companies yet
                    </td>
                  </tr>
                ) : (
                  Object.entries(dashboard.companies.byStatus).map(
                    ([status, count]) => (
                      <tr
                        key={status}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[status] || 'bg-gray-500'} text-white`}
                          >
                            {statusLabelMap[status] || status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium">
                            {count as number}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Registrations ── */}
      <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b py-1.5 px-4 gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Recent Registrations
                </CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Company registration requests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-purple-600 hover:text-purple-700"
                onClick={() =>
                  navigate({ to: '/admin/registrations' } as any)
                }
              >
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Admin Name
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Subdomain
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {regLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : regItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  regItems.map((reg: any) => (
                    <tr
                      key={reg.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-sm">
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
                        <span className="text-sm font-mono text-blue-600">
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
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[reg.status] || 'bg-gray-500'} text-white`}
                        >
                          {statusLabelMap[reg.status] ||
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
    </div>
  )
}
