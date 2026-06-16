/**
 * Plans Admin Page — Full CRUD for subscription plans
 *
 * Route: /(platform)/admin/plans
 * Shows gradient stat cards, search filter, HTML table with all plan fields,
 * and an "Add Plan" button that opens CreatePlanForm.
 * Delete action with browser confirm via useDeletePlan.
 * Uses reference gradient card design pattern with purple theme.
 */

import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CreditCard,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  Activity,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  useAdminPlans,
  useDeletePlan,
} from '@/hooks/usePlatformAdmin'
import { CreatePlanForm } from '@/features/platform/plans/components/CreatePlanForm'

export const Route = createFileRoute('/(platform)/admin/plans')({
  component: PlansAdminPage,
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
}

// ── Component ───────────────────────────────────────────────────────────

function PlansAdminPage() {
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data: plansData, isLoading } = useAdminPlans({ search })
  const deletePlan = useDeletePlan()

  const plans = plansData?.data ?? []

  // Computed stats
  const totalPlans = plans.length
  const activePlans = plans.filter((p) => p.status === 'active').length

  const stats = useMemo(
    () => [
      {
        label: 'Total Plans',
        value: totalPlans,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active Plans',
        value: activePlans,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
    ],
    [totalPlans, activePlans]
  )

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the plan "${name}"?`)) {
      deletePlan.mutate(id)
    }
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
              <h1 className="text-2xl font-bold text-white">
                Subscription Plans
              </h1>
              <p className="text-sm text-white/80">
                Manage subscription plans for tenants
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-sm font-medium text-white/90">
                  {item.label}
                </p>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
        <Input
          placeholder="Search plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search ? 'No plans match your search.' : 'No plans created yet.'}
          </p>
          {!search && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
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
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {plan.slug}
                  </td>
                  <td className="px-4 py-3">
                    {plan.price?.monthly != null
                      ? `$${Number(plan.price.monthly).toFixed(2)}`
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    {plan.price?.yearly != null
                      ? `$${Number(plan.price.yearly).toFixed(2)}`
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                        statusColorMap[plan.status] || 'bg-gray-400'
                      )}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {plan.max_users ?? 'Unlimited'}
                  </td>
                  <td className="px-4 py-3">{plan.display_order}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={deletePlan.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Plan Dialog */}
      <CreatePlanForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
