/**
 * Modules Admin Page — Manage platform/landing-page modules
 *
 * Route: /(platform)/admin/modules
 * Features: gradient header, gradient stat cards, category filter, search,
 * status filter, create-module dialog, toggle status, delete with confirm.
 * Visually consistent with companies.tsx purple-gradient pattern.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Puzzle,
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
  useModules,
  useDeleteModule,
  useUpdateModule,
} from '@/hooks/usePlatformAdmin'
import { CreateModuleForm } from '@/features/platform/modules/components/CreateModuleForm'

export const Route = createFileRoute('/(platform)/admin/modules')({
  component: ModulesPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface ModuleItem {
  id: number
  slug: string
  name: string
  category: string | null
  description: string | null
  status: 'active' | 'inactive'
  sort_order: number
  created_at?: string
  updated_at?: string
}

interface ModulesResponse {
  success?: boolean
  data?: ModuleItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
  // Possible top-level fallbacks
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

// ── Category filter options ─────────────────────────────────────────────

const CATEGORIES = ['', 'core', 'addon', 'enterprise', 'beta'] as const
const STATUSES = ['', 'active', 'inactive'] as const

// ── Component ───────────────────────────────────────────────────────────

function ModulesPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const { data: response, isLoading } = useModules({
    status,
    category,
    search,
    page,
    limit,
  })
  const deleteModule = useDeleteModule()
  const updateModule = useUpdateModule()

  // Normalize RAW response shape (prefer .pagination, fall back to top-level)
  const normalized: ModulesResponse = (response ?? {}) as ModulesResponse
  const modules: ModuleItem[] = normalized.data ?? []
  const pagination = normalized.pagination ?? {
    page: normalized.page ?? 1,
    limit: normalized.limit ?? limit,
    total: normalized.total ?? modules.length,
    totalPages:
      normalized.totalPages ??
      Math.ceil((normalized.total ?? modules.length) / limit),
  }
  const totalPages = pagination.totalPages ?? 1

  // Stats
  const totalModules = pagination.total
  const activeModules = modules.filter((m) => m.status === 'active').length
  const inactiveModules = modules.filter((m) => m.status === 'inactive').length

  const stats = useMemo(
    () => [
      {
        label: 'Total Modules',
        value: totalModules,
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <Puzzle className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active',
        value: activeModules,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive',
        value: inactiveModules,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ],
    [totalModules, activeModules, inactiveModules]
  )

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleToggleStatus = (module: ModuleItem) => {
    const next = module.status === 'active' ? 'inactive' : 'active'
    updateModule.mutate({
      id: module.id,
      data: { status: next },
    })
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      deleteModule.mutate(id)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
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
              <Puzzle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Modules Management
              </h1>
              <p className="text-sm text-white/80">
                Manage platform modules and feature availability
              </p>
            </div>
          </div>
          <CreateModuleForm />
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

            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters: Category pills + Status pills + Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat || 'all'}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                category === cat &&
                  'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
              )}
            >
              {cat || 'All Categories'}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <Button
                key={s || 'all-status'}
                variant={status === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(s)}
                className={cn(
                  'capitalize',
                  status === s &&
                    'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                )}
              >
                {s || 'All'}
              </Button>
            ))}
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
            <Input
              placeholder="Search modules..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Puzzle className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search || category || status
              ? 'No modules found matching your filters.'
              : 'No modules have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Puzzle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate">
                      {module.name}
                    </p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {module.slug}
                    </code>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white',
                    module.status === 'active'
                      ? 'bg-emerald-500'
                      : 'bg-gray-400'
                  )}
                >
                  {module.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {module.description || 'No description'}
              </p>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  {module.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-border capitalize">
                      {module.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Order: {module.sort_order}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(module)}
                    disabled={updateModule.isPending}
                    title={
                      module.status === 'active' ? 'Deactivate' : 'Activate'
                    }
                    className="text-purple-600 hover:bg-purple-50 hover:text-purple-700 h-8 px-2"
                  >
                    {module.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(module.id)}
                    disabled={deleteModule.isPending}
                    title="Delete"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  )
}
