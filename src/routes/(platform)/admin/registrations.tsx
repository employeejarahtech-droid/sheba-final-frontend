/**
 * Registrations Admin Page — Manage pending tenant registrations
 *
 * Route: /(platform)/admin/registrations
 * Features ported from the legacy project and adapted to the current stack:
 *   - Status filter tabs (All / Pending / Approved / Rejected / Completed) with counts
 *   - Search + gradient stat cards
 *   - Table with inline Approve (with progress dialog) and Reject (with reason dialog)
 *   - Manual "Add Registration" dialog (create form) with debounced subdomain
 *     availability check + plan select + billing cycle select
 *   - Delete with confirmation
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Globe,
  Phone,
  CreditCard,
  UserPlus,
  Ban,
  Eye,
  Shield,
  CalendarClock,
  Plus,
  Trash2,
  Activity,
  Database,
  Rocket,
  PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBaseDomain, getTenantDisplayDomain } from '@/lib/subdomain'
import { checkSubdomain } from '@/services/platform-admin'
import {
  useRegistrations,
  useApproveRegistration,
  useRejectRegistration,
  useCreateRegistration,
  useDeleteRegistration,
  useAdminPlans,
} from '@/hooks/usePlatformAdmin'
import type { PlatformRegistration } from '@/types/platform.types'

export const Route = createFileRoute('/(platform)/admin/registrations')({
  component: RegistrationsAdminPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface RegistrationsResponse {
  success?: boolean
  data?: PlatformRegistration[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

interface PlansResponse {
  success?: boolean
  data?: Array<{
    id: number
    name: string
    slug: string
    status?: string
  }>
}

type Cycle = 'monthly' | 'quarterly' | 'biannual' | 'yearly'
type RegStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// ── Status Maps ─────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'completed'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  completed: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
}

const statusDotClass: Record<string, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  completed: 'bg-blue-500',
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

const CYCLES: Cycle[] = ['monthly', 'quarterly', 'biannual', 'yearly']

// ── Component ───────────────────────────────────────────────────────────

function RegistrationsAdminPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Dialog state
  const [viewReg, setViewReg] = useState<PlatformRegistration | null>(null)
  const [rejectReg, setRejectReg] = useState<PlatformRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteReg, setDeleteReg] = useState<PlatformRegistration | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Approve progress state
  const [approveReg, setApproveReg] = useState<PlatformRegistration | null>(null)
  const [approveStep, setApproveStep] = useState(0) // 0 idle, 1..3 steps, 4 done
  const [approveError, setApproveError] = useState<string | null>(null)
  const approveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual registration form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    company_name: '',
    subdomain: '',
    phone: '',
    plan_id: 'manual',
    cycle: 'monthly' as Cycle,
    admin_password: '',
  })

  // Subdomain availability check state
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const subdomainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusParam = statusFilter === 'all' ? undefined : statusFilter

  // ── Queries ──────────────────────────────────────────────────────────

  const { data: response, isLoading } = useRegistrations({
    page,
    limit,
    search,
    status: statusParam,
  })
  const { data: plansResponse } = useAdminPlans()

  const normalized: RegistrationsResponse = (response as RegistrationsResponse) ?? {}
  const registrations: PlatformRegistration[] = normalized.data ?? []
  const pagination = normalized.pagination ?? { page: 1, limit, total: 0 }
  const totalPages =
    pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / limit))

  const plans: PlansResponse['data'] =
    (plansResponse as unknown as PlansResponse)?.data ?? []

  // ── Mutations ────────────────────────────────────────────────────────

  const approveMutation = useApproveRegistration()
  const rejectMutation = useRejectRegistration()
  const createMutation = useCreateRegistration()
  const deleteMutation = useDeleteRegistration()

  // ── Cleanup approve timers on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (approveTimerRef.current) clearTimeout(approveTimerRef.current)
      if (subdomainTimer.current) clearTimeout(subdomainTimer.current)
    }
  }, [])

  // ── Subdomain availability check ─────────────────────────────────────

  const runSubdomainCheck = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSubdomainAvailable(null)
      setCheckingSubdomain(false)
      return
    }
    setCheckingSubdomain(true)
    setSubdomainAvailable(null)
    try {
      const res = await checkSubdomain(slug)
      if (res.success) {
        setSubdomainAvailable(res.data.available === true)
      } else {
        setSubdomainAvailable(false)
      }
    } catch {
      setSubdomainAvailable(false)
    } finally {
      setCheckingSubdomain(false)
    }
  }, [])

  // Debounced subdomain check on form.subdomain change
  useEffect(() => {
    if (subdomainTimer.current) clearTimeout(subdomainTimer.current)
    const val = form.subdomain
    if (!val || val.length < 2) {
      setSubdomainAvailable(null)
      setCheckingSubdomain(false)
      return
    }
    setCheckingSubdomain(true)
    subdomainTimer.current = setTimeout(() => runSubdomainCheck(val), 500)
    return () => {
      if (subdomainTimer.current) clearTimeout(subdomainTimer.current)
    }
  }, [form.subdomain, runSubdomainCheck])

  // ── Stats ────────────────────────────────────────────────────────────

  const pendingCount = registrations.filter((r) => r.status === 'pending').length
  const approvedCount = registrations.filter((r) => r.status === 'approved').length
  const rejectedCount = registrations.filter((r) => r.status === 'rejected').length

  const stats = useMemo(
    () => [
      {
        label: 'Total Registrations',
        value: pagination.total ?? registrations.length,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <ClipboardList className="w-6 h-6 text-white" />,
      },
      {
        label: 'Pending Review',
        value: pendingCount,
        gradient: 'from-amber-600 to-amber-400',
        shadow: 'shadow-amber-500/30',
        icon: <Clock className="w-6 h-6 text-white" />,
      },
      {
        label: 'Approved',
        value: approvedCount,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      },
      {
        label: 'Rejected',
        value: rejectedCount,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ],
    [pagination.total, registrations.length, pendingCount, approvedCount, rejectedCount]
  )

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value)
    setPage(1)
  }

  const relativeDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleApprove = useCallback(
    (reg: PlatformRegistration) => {
      setApproveReg(reg)
      setApproveStep(1)
      setApproveError(null)

      // Step 1: Validating registration (brief)
      approveTimerRef.current = setTimeout(() => {
        setApproveStep(2)
        // Step 2: Creating company & admin (brief)
        approveTimerRef.current = setTimeout(() => {
          setApproveStep(3)
          // Step 3: Provisioning tenant database (the real API call)
          approveMutation.mutate(reg.id, {
            onSuccess: () => {
              approveTimerRef.current = setTimeout(() => {
                setApproveStep(4)
              }, 500)
            },
            onError: (err: Error) => {
              setApproveError(err.message || 'Failed to approve registration')
              setApproveStep(0)
            },
          })
        }, 400)
      }, 600)
    },
    [approveMutation]
  )

  const resetApprove = () => {
    if (approveTimerRef.current) clearTimeout(approveTimerRef.current)
    setApproveReg(null)
    setApproveStep(0)
    setApproveError(null)
  }

  const openReject = (reg: PlatformRegistration) => {
    setRejectReg(reg)
    setRejectReason('')
  }

  const confirmReject = () => {
    if (!rejectReg) return
    rejectMutation.mutate(
      { id: rejectReg.id, reason: rejectReason.trim() || undefined },
      {
        onSuccess: () => {
          setRejectReg(null)
          setRejectReason('')
        },
      }
    )
  }

  const confirmDelete = () => {
    if (!deleteReg) return
    deleteMutation.mutate(deleteReg.id, {
      onSuccess: () => setDeleteReg(null),
    })
  }

  const resetCreateForm = () => {
    setForm({
      name: '',
      email: '',
      company_name: '',
      subdomain: '',
      phone: '',
      plan_id: 'manual',
      cycle: 'monthly',
      admin_password: '',
    })
    setSubdomainAvailable(null)
    setCheckingSubdomain(false)
  }

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim(),
        subdomain: form.subdomain.trim(),
        phone: form.phone.trim() || undefined,
        plan_id: form.plan_id === 'manual' ? null : Number(form.plan_id),
        cycle: form.cycle,
        admin_password: form.admin_password.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          resetCreateForm()
        },
      }
    )
  }

  const createDisabled =
    createMutation.isPending ||
    !form.name.trim() ||
    !form.email.trim() ||
    !form.company_name.trim() ||
    !form.subdomain.trim() ||
    subdomainAvailable === false

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Registrations</h1>
              <p className="text-sm text-white/80">
                Review and manage company registration requests
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20"
          >
            <Plus className="h-4 w-4" />
            Add Registration
          </Button>
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
            placeholder="Search registrations..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
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
              {s === 'all' ? 'All' : statusLabel[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No registrations found matching your filters.'
              : 'No registrations yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Admin</th>
                <th className="px-4 py-3 text-left font-medium">Plan / Cycle</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Company */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{reg.company_name || '—'}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {reg.subdomain ? getTenantDisplayDomain(reg.subdomain) : '—'}
                      </p>
                    </div>
                  </td>

                  {/* Admin */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{reg.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{reg.email}</p>
                    </div>
                  </td>

                  {/* Plan / Cycle */}
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>
                      <p>{reg.plan_name || 'Manual'}</p>
                      <p className="text-xs capitalize">{reg.cycle || 'monthly'}</p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1.5 capitalize',
                        statusBadgeClass[reg.status] ?? ''
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          statusDotClass[reg.status] ?? 'bg-gray-400'
                        )}
                      />
                      {statusLabel[reg.status] ?? reg.status}
                    </Badge>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {relativeDate(reg.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewReg(reg)}
                        title="View details"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {reg.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(reg)}
                            disabled={approveMutation.isPending}
                            title="Approve"
                            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReject(reg)}
                            disabled={rejectMutation.isPending}
                            title="Reject"
                            className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteReg(reg)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
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
                  if (typeof prev === 'number' && p - prev > 1) {
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

      {/* ── View Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!viewReg}
        onOpenChange={(open) => !open && setViewReg(null)}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              Registration Details
            </DialogTitle>
            <DialogDescription>
              {viewReg?.company_name || 'Registration'} #{viewReg?.id}
            </DialogDescription>
          </DialogHeader>
          {viewReg && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Admin Name</span>
                  <p className="font-medium">{viewReg.name || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{viewReg.email || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{viewReg.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Subdomain</span>
                  <p className="font-medium font-mono">
                    {viewReg.subdomain ? getTenantDisplayDomain(viewReg.subdomain) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <p className="font-medium">{viewReg.plan_name || 'Manual'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <p className="font-medium capitalize">{viewReg.cycle || 'monthly'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1.5 capitalize',
                        statusBadgeClass[viewReg.status] ?? ''
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          statusDotClass[viewReg.status] ?? 'bg-gray-400'
                        )}
                      />
                      {statusLabel[viewReg.status] ?? viewReg.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {viewReg.created_at
                      ? new Date(viewReg.created_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog (with reason) ──────────────────────────────────── */}
      <Dialog
        open={!!rejectReg}
        onOpenChange={(open) => {
          if (!open) {
            setRejectReg(null)
            setRejectReason('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-amber-500" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              Reject the registration from{' '}
              <strong>{rejectReg?.company_name}</strong>
              {rejectReg?.name && (
                <>
                  {' '}by <strong>{rejectReg.name}</strong>
                </>
              )}
              . The applicant will need to submit a new registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Provide a reason for rejection (optional)..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectReg(null)
                setRejectReason('')
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Reject Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve Progress Dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!approveReg}
        onOpenChange={(open) => {
          if (!open && (approveStep === 4 || (approveError && approveStep === 0))) {
            resetApprove()
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[440px]"
          onPointerDownOutside={(e) => {
            if (approveStep >= 1 && approveStep < 4) e.preventDefault()
          }}
        >
          {/* Success State */}
          {approveStep === 4 && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <PartyPopper className="h-8 w-8 text-emerald-600" />
                </div>
                <DialogTitle className="text-xl">Registration Approved!</DialogTitle>
                <DialogDescription>
                  <strong>{approveReg?.company_name}</strong> is ready to go.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subdomain</span>
                  <span className="font-mono font-medium text-blue-600">
                    {getTenantDisplayDomain(approveReg?.subdomain)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin</span>
                  <span className="font-medium">{approveReg?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{approveReg?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-mono text-xs">
                    company_{approveReg?.subdomain}_db
                  </span>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={resetApprove}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Error State */}
          {approveError && approveStep === 0 && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <DialogTitle className="text-xl">Approval Failed</DialogTitle>
                <DialogDescription className="text-red-600">
                  {approveError}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={resetApprove}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Progress State (steps 1-3) */}
          {approveStep >= 1 && approveStep < 4 && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Rocket className="h-8 w-8 text-blue-600" />
                </div>
                <DialogTitle className="text-xl">Approving Registration</DialogTitle>
                <DialogDescription>
                  Setting up <strong>{approveReg?.company_name}</strong>...
                </DialogDescription>
              </DialogHeader>

              {/* Progress Bar */}
              <div className="mt-2 w-full">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${(approveStep / 3) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground text-center">
                  Step {approveStep} of 3
                </p>
              </div>

              {/* Steps */}
              <div className="mt-4 space-y-3">
                {[
                  { step: 1, label: 'Validating registration', icon: ClipboardList },
                  { step: 2, label: 'Creating company & admin', icon: Building2 },
                  { step: 3, label: 'Provisioning tenant database', icon: Database },
                ].map(({ step, label, icon: Icon }) => (
                  <div
                    key={step}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 transition-all duration-300',
                      approveStep > step
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : approveStep === step
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-muted bg-muted/30 text-muted-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                        approveStep > step
                          ? 'bg-emerald-500 text-white'
                          : approveStep === step
                          ? 'bg-blue-500 text-white'
                          : 'bg-muted'
                      )}
                    >
                      {approveStep > step ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : approveStep === step ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        approveStep < step && 'opacity-50'
                      )}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Manual Registration Dialog ───────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              Add Registration
            </DialogTitle>
            <DialogDescription>
              Create a new company registration manually. Password will be
              auto-generated if left blank.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Admin Name */}
            <div className="grid gap-2">
              <Label htmlFor="reg-name" className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Admin Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="reg-email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            {/* Company Name */}
            <div className="grid gap-2">
              <Label
                htmlFor="reg-company"
                className="flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-company"
                placeholder="Acme Corp"
                value={form.company_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company_name: e.target.value }))
                }
              />
            </div>

            {/* Subdomain */}
            <div className="grid gap-2">
              <Label
                htmlFor="reg-subdomain"
                className="flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                Subdomain <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-0">
                <div className="relative flex-1">
                  <Input
                    id="reg-subdomain"
                    placeholder="acme"
                    className={cn(
                      'rounded-r-none pr-8',
                      subdomainAvailable === true &&
                        'border-emerald-500 focus-visible:ring-emerald-500',
                      subdomainAvailable === false &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                    value={form.subdomain}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                  />
                  {checkingSubdomain && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 h-9 text-sm text-muted-foreground">
                  .{getBaseDomain()}
                </span>
              </div>
              {subdomainAvailable === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Subdomain is available
                </p>
              )}
              {subdomainAvailable === false && form.subdomain.length >= 2 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Subdomain is already taken
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="reg-phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone
              </Label>
              <Input
                id="reg-phone"
                placeholder="+880 1XXX-XXXXXX"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>

            {/* Plan & Cycle in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Plan
                </Label>
                <Select
                  value={form.plan_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, plan_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={String(plan.id)}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Billing Cycle
                </Label>
                <Select
                  value={form.cycle}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, cycle: v as Cycle }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CYCLES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password (optional) */}
            <div className="grid gap-2">
              <Label
                htmlFor="reg-password"
                className="flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Password{' '}
                <span className="text-xs text-muted-foreground font-normal">
                  (auto-generated if blank)
                </span>
              </Label>
              <Input
                id="reg-password"
                type="text"
                placeholder="Leave blank to auto-generate"
                value={form.admin_password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, admin_password: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              disabled={createDisabled}
              onClick={handleCreate}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteReg}
        onOpenChange={(open) => !open && setDeleteReg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the registration from{' '}
              <strong>{deleteReg?.company_name}</strong>
              {deleteReg?.name && (
                <>
                  {' '}by <strong>{deleteReg.name}</strong>
                </>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
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
