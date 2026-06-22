/**
 * Subscriptions Admin Page — Manage company subscription statuses
 *
 * Route: /(platform)/admin/subscriptions
 * Features: search, status filter, status-update select, change expiry/plan,
 * cancel action with confirm, gradient stat cards, pagination.
 * Mirrors the companies.tsx purple-gradient visual pattern.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Receipt,
  Search,
  Activity,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSubscriptions,
  useUpdateSubscription,
  useAdminPlans,
} from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/subscriptions')({
  component: SubscriptionsPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface SubscriptionRow {
  id: number
  name: string
  email?: string | null
  subdomain: string
  plan_id: number | null
  plan_name?: string
  plan_slug?: string
  subscription_status: string
  subscription_expires_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  is_active?: number
  created_at?: string
}

interface SubscriptionsResponse {
  success?: boolean
  data?: SubscriptionRow[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

interface PlanRow {
  id: number
  name: string
  slug: string
}

// ── Status Maps ─────────────────────────────────────────────────────────

const SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'expired',
  'canceled',
  'unpaid',
] as const

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-500',
  trialing: 'bg-blue-500',
  past_due: 'bg-amber-500',
  expired: 'bg-red-500',
  canceled: 'bg-gray-400',
  unpaid: 'bg-red-500',
}

const statusLabelMap: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past Due',
  expired: 'Expired',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
}

// ── Component ───────────────────────────────────────────────────────────

function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [cancelTarget, setCancelTarget] = useState<SubscriptionRow | null>(null)
  const [editTarget, setEditTarget] = useState<SubscriptionRow | null>(null)

  // Edit dialog form state
  const [editStatus, setEditStatus] = useState<string>('active')
  const [editExpiresAt, setEditExpiresAt] = useState<string>('')
  const [editPlanId, setEditPlanId] = useState<string>('__none')

  const statusParam = statusFilter === 'all' ? undefined : statusFilter

  const { data: response, isLoading } = useSubscriptions({
    page,
    limit,
    search,
    status: statusParam,
  })
  const { data: plansData } = useAdminPlans()

  const updateSubscription = useUpdateSubscription()

  // Normalize response shape — RAW response: rows via .data, pagination via .pagination
  const normalized: SubscriptionsResponse =
    (response as SubscriptionsResponse) ?? {}
  const subscriptions: SubscriptionRow[] = normalized.data ?? []
  const pagination = normalized.pagination ?? {
    page: 1,
    limit,
    total: 0,
  }
  const totalPages =
    pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / limit))

  const plans: PlanRow[] = (plansData as PlanRow[] | undefined) ?? []

  // Compute stats
  const activeCount = subscriptions.filter(
    (s) => s.subscription_status === 'active'
  ).length
  const trialingCount = subscriptions.filter(
    (s) => s.subscription_status === 'trialing'
  ).length
  const atRiskCount = subscriptions.filter(
    (s) => s.subscription_status === 'past_due' || s.subscription_status === 'unpaid'
  ).length
  const expiredCount = subscriptions.filter(
    (s) => s.subscription_status === 'expired' || s.subscription_status === 'canceled'
  ).length

  const stats = useMemo(
    () => [
      {
        label: 'Total Subscriptions',
        value: pagination.total,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Receipt className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active',
        value: activeCount,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      },
      {
        label: 'Trialing',
        value: trialingCount,
        gradient: 'from-blue-600 to-cyan-400',
        shadow: 'shadow-blue-500/30',
        icon: <Clock className="w-6 h-6 text-white" />,
      },
      {
        label: 'At Risk / Expired',
        value: atRiskCount + expiredCount,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <AlertTriangle className="w-6 h-6 text-white" />,
      },
    ],
    [pagination.total, activeCount, trialingCount, atRiskCount, expiredCount]
  )

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleQuickStatusChange = (
    row: SubscriptionRow,
    newStatus: string
  ) => {
    updateSubscription.mutate({
      companyId: row.id,
      data: {
        status: newStatus,
        subscription_expires_at: row.subscription_expires_at,
        plan_id: row.plan_id,
      },
    })
  }

  const openEditDialog = (row: SubscriptionRow) => {
    setEditTarget(row)
    setEditStatus(row.subscription_status || 'active')
    setEditPlanId(row.plan_id != null ? String(row.plan_id) : '__none')
    // Convert ISO datetime to yyyy-MM-dd for the date input
    if (row.subscription_expires_at) {
      const d = new Date(row.subscription_expires_at)
      if (!Number.isNaN(d.getTime())) {
        setEditExpiresAt(d.toISOString().slice(0, 10))
      } else {
        setEditExpiresAt('')
      }
    } else {
      setEditExpiresAt('')
    }
  }

  const handleSaveEdit = () => {
    if (!editTarget) return
    updateSubscription.mutate(
      {
        companyId: editTarget.id,
        data: {
          status: editStatus,
          subscription_expires_at: editExpiresAt
            ? new Date(editExpiresAt).toISOString()
            : null,
          plan_id: editPlanId === '__none' ? null : Number(editPlanId),
        },
      },
      {
        onSuccess: () => setEditTarget(null),
      }
    )
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    updateSubscription.mutate(
      {
        companyId: cancelTarget.id,
        data: {
          status: 'canceled',
          subscription_expires_at: cancelTarget.subscription_expires_at,
          plan_id: cancelTarget.plan_id,
        },
      },
      {
        onSuccess: () => setCancelTarget(null),
      }
    )
  }

  const canCancel = (status: string) =>
    status === 'active' || status === 'trialing'

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return { label: '—', tone: 'muted' as const }
    const expires = new Date(expiresAt)
    const diffDays = Math.ceil((expires.getTime() - Date.now()) / 86400000)
    if (diffDays < 0)
      return {
        label: `${expires.toLocaleDateString()} (expired ${Math.abs(
          diffDays
        )}d ago)`,
        tone: 'red' as const,
      }
    if (diffDays <= 7)
      return {
        label: `${expires.toLocaleDateString()} (${diffDays}d left)`,
        tone: 'amber' as const,
      }
    return {
      label: `${expires.toLocaleDateString()} (${diffDays}d left)`,
      tone: 'muted' as const,
    }
  }

  const expiryToneClass = {
    muted: 'text-muted-foreground',
    amber: 'text-amber-600 font-medium',
    red: 'text-red-600 font-medium',
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
              <p className="text-sm text-white/80">
                Monitor and manage company subscription statuses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    item.value || 0
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

      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {SUBSCRIPTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabelMap[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Receipt className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No subscriptions found matching your filters.'
              : 'No subscriptions exist yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Expires</th>
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const expiry = formatExpiry(sub.subscription_expires_at)
                return (
                  <tr
                    key={sub.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Company */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.subdomain}
                        </p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.plan_name || 'No Plan'}
                    </td>

                    {/* Status (select) */}
                    <td className="px-4 py-3">
                      <Select
                        value={sub.subscription_status}
                        onValueChange={(val) => handleQuickStatusChange(sub, val)}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <span
                            className={cn(
                              'mr-1.5 inline-block h-2 w-2 rounded-full',
                              statusColorMap[sub.subscription_status] ??
                                'bg-gray-400'
                            )}
                          />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBSCRIPTION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabelMap[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Expires */}
                    <td
                      className={cn(
                        'px-4 py-3 text-xs',
                        expiryToneClass[expiry.tone]
                      )}
                    >
                      {expiry.label}
                    </td>

                    {/* Is Active */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            sub.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(sub)}
                          title="Edit subscription"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelTarget(sub)}
                          disabled={
                            !canCancel(sub.subscription_status) ||
                            updateSubscription.isPending
                          }
                          title="Cancel subscription"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true
                if (Math.abs(p - page) <= 1) return true
                return false
              })
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1]
                  if (p - prev > 1) {
                    acc.push('ellipsis')
                  }
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'w-9',
                      page === item && 'bg-purple-600 hover:bg-purple-700 text-white'
                    )}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update status, expiry, and plan for{' '}
              <strong>{editTarget?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabelMap[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-at">Expires At</Label>
              <Input
                id="expires-at"
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlanId} onValueChange={setEditPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No Plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateSubscription.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateSubscription.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the subscription for{' '}
              <strong>{cancelTarget?.name}</strong>. The company will lose access
              to paid features when the current period ends
              {cancelTarget?.subscription_expires_at && (
                <>
                  {' '}
                  on{' '}
                  <strong>
                    {new Date(
                      cancelTarget.subscription_expires_at
                    ).toLocaleDateString()}
                  </strong>
                </>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateSubscription.isPending}>
              Keep Active
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={updateSubscription.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
