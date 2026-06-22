/**
 * Plans Admin List Page — Manage subscription plans
 *
 * Route: /(platform)/admin/plans/
 * Features: search, gradient stat cards, HTML table with pricing (monthly/yearly),
 * max_users and status, delete with AlertDialog confirm, "Add Plan" button linking
 * to /admin/plans/add, row "Edit" link to /admin/plans/edit/$planId.
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CreditCard,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  Activity,
  Loader2,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  useAdminPlans,
  useDeletePlan,
} from '@/hooks/usePlatformAdmin'
import type { PlatformSubscriptionPlan } from '@/types/platform.types'

export const Route = createFileRoute('/(platform)/admin/plans/')({
  component: PlansListPage,
})

// ── Status Color Map ────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  archived: 'bg-amber-500',
}

const statusLabelMap: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
}

// ── Component ───────────────────────────────────────────────────────────

function PlansListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planToDelete, setPlanToDelete] = useState<PlatformSubscriptionPlan | null>(null)

  const statusParam = statusFilter === 'all' ? undefined : statusFilter

  const { data: plans, isLoading } = useAdminPlans({
    search,
    status: statusParam,
  })
  const deletePlan = useDeletePlan()

  const list: PlatformSubscriptionPlan[] = plans ?? []

  // Computed stats
  const totalPlans = list.length
  const activePlans = list.filter((p) => p.status === 'active').length
  const inactivePlans = list.filter((p) => p.status !== 'active').length

  const stats = useMemo(
    () => [
      {
        label: 'Total Plans',
        value: totalPlans,
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active',
        value: activePlans,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive',
        value: inactivePlans,
        gradient: 'from-gray-600 to-gray-400',
        shadow: 'shadow-gray-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
    ],
    [totalPlans, activePlans, inactivePlans]
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  const confirmDelete = () => {
    if (!planToDelete) return
    deletePlan.mutate(planToDelete.id, {
      onSuccess: () => setPlanToDelete(null),
    })
  }

  const formatPrice = (value: number | undefined | null): string => {
    if (value == null) return '--'
    return `$${Number(value).toFixed(2)}`
  }

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
              <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
              <p className="text-sm text-white/80">
                Manage subscription plans for tenants
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            <Link to="/admin/plans/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
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
            {/* Background Pattern */}
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

            {/* Progress/Indicator line */}
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
            placeholder="Search plans..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['all', 'active', 'inactive', 'archived'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange(s)}
              className={cn(
                'h-8 text-xs',
                statusFilter === s && 'bg-purple-600 hover:bg-purple-700 text-white'
              )}
            >
              {s === 'all' ? 'All' : statusLabelMap[s] ?? s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No plans found matching your filters.'
              : 'No plans created yet.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700">
              <Link to="/admin/plans/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Monthly</th>
                <th className="px-4 py-3 text-left font-medium">Yearly</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Max Users</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-purple-600">
                      {plan.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(plan.price?.monthly)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(plan.price?.yearly)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                        statusColorMap[plan.status] || 'bg-gray-400'
                      )}
                    >
                      {statusLabelMap[plan.status] ?? plan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {plan.max_users ?? 'Unlimited'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    #{plan.display_order}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        title="Edit plan"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Link
                          to="/admin/plans/edit/$planId"
                          params={{ planId: String(plan.id) }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlanToDelete(plan)}
                        disabled={deletePlan.isPending}
                        title="Delete plan"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan{' '}
              <strong>{planToDelete?.name}</strong>.{' '}
              {planToDelete?.status === 'active' && 'This plan is currently active. '}
              Any companies using this plan will need to be migrated first. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlan.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePlan.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
