/**
 * Companies Admin Page — Full CRUD for managing platform companies/tenants
 *
 * Route: /(platform)/admin/companies
 * Features: search, pagination, gradient stat cards, toggle active, delete with confirm.
 * Uses reference gradient card design pattern with purple theme.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Activity,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCompanies,
  useToggleCompanyActive,
  useDeleteCompany,
} from '@/hooks/usePlatformAdmin'
import { CreateCompanyForm } from '@/features/platform/companies/components/CreateCompanyForm'

export const Route = createFileRoute('/(platform)/admin/companies')({
  component: CompaniesPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface Company {
  id: number
  name: string
  subdomain: string
  plan_name?: string
  plan_id?: number
  subscription_status?: string
  db_type: string
  is_active: boolean
  email?: string
}

interface CompaniesResponse {
  data?: {
    items?: Company[]
    meta?: {
      page: number
      limit: number
      total: number
      totalPages?: number
    }
  }
  items?: Company[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

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

function CompaniesPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data: response, isLoading } = useCompanies({ page, limit, search })
  const toggleActive = useToggleCompanyActive()
  const deleteCompany = useDeleteCompany()

  // Normalize response shape
  const normalized: CompaniesResponse = response ?? {}
  const companies: Company[] =
    normalized.data?.items ?? normalized.items ?? []
  const meta = normalized.data?.meta ?? normalized.meta ?? {
    page: 1,
    limit: 10,
    total: 0,
  }
  const totalPages = meta.totalPages ?? Math.ceil(meta.total / limit)

  // Compute stats
  const totalCompanies = meta.total
  const activeCompanies = companies.filter((c) => c.is_active).length
  const inactiveCompanies = companies.filter((c) => !c.is_active).length

  const stats = useMemo(
    () => [
      {
        label: 'Total Companies',
        value: totalCompanies,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Building2 className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active',
        value: activeCompanies,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive',
        value: inactiveCompanies,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ],
    [totalCompanies, activeCompanies, inactiveCompanies]
  )

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleToggleActive = (company: Company) => {
    toggleActive.mutate(company.id)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteCompany.mutate(id)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
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
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Companies Management
              </h1>
              <p className="text-sm text-white/80">
                Manage platform tenants and their subscriptions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
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
          placeholder="Search companies..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search
              ? 'No companies found matching your search.'
              : 'No companies have been created yet.'}
          </p>
          {!search && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Subdomain</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">DB Type</th>
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      {company.email && (
                        <p className="text-xs text-muted-foreground">
                          {company.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Subdomain */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {company.subdomain}
                    </span>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {company.plan_name || '--'}
                  </td>

                  {/* Subscription Status */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                        statusColorMap[company.subscription_status || ''] ||
                          'bg-gray-400'
                      )}
                    >
                      {company.subscription_status || 'none'}
                    </span>
                  </td>

                  {/* DB Type */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border capitalize">
                      {company.db_type}
                    </span>
                  </td>

                  {/* Is Active */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          company.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(company)}
                        title={company.is_active ? 'Deactivate' : 'Activate'}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        {company.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(company.id)}
                        disabled={deleteCompany.isPending}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, meta.total)} of {meta.total}
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
                      page === item &&
                        'bg-purple-600 hover:bg-purple-700 text-white'
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

      {/* Create Company Dialog */}
      <CreateCompanyForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
