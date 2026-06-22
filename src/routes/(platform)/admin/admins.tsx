/**
 * Admin Users Page — Manage platform administrators and their roles
 *
 * Route: /(platform)/admin/admins
 * Features: purple-gradient header, gradient stat cards, search, custom
 * pagination, toggle active (useToggleAdminActive), delete with confirm,
 * inline create-admin dialog.
 *
 * Hooks (from @/hooks/usePlatformAdmin):
 *   useAdmins({page,limit,search})  -> RAW { success, data: PlatformAdminUser[], pagination }
 *   useCreateAdmin()                -> mutate({ email, password, name, role, permissions })
 *   useUpdateAdmin()                -> mutate({ id, data })
 *   useDeleteAdmin()                -> mutate(id)
 *   useToggleAdminActive()          -> mutate(id)
 *
 * NOTE: backend returns `permissions` as a JSON string and `is_active` as 0/1.
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
  ShieldCheck,
  Users,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
  useToggleAdminActive,
} from '@/hooks/usePlatformAdmin'
import { usePlatformAuthStore } from '@/stores/platform-auth-store'

export const Route = createFileRoute('/(platform)/admin/admins')({
  component: AdminsPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface AdminUser {
  id: number
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  permissions: Record<string, boolean> | string
  is_active: boolean | number
  profile_image?: string | null
  thumb_url?: string | null
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

interface AdminsResponse {
  success?: boolean
  data?: AdminUser[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
  // Back-compat shapes
  meta?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

interface CreateAdminPayload {
  email: string
  password: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  permissions?: Record<string, boolean>
}

// ── Role styling ────────────────────────────────────────────────────────

const roleColorMap: Record<string, string> = {
  super_admin: 'bg-purple-500',
  admin: 'bg-blue-500',
  viewer: 'bg-slate-400',
}

const roleLabelMap: Record<string, string> = {
  super_admin: 'SUPER ADMIN',
  admin: 'ADMIN',
  viewer: 'VIEWER',
}

// ── Helpers ─────────────────────────────────────────────────────────────

function isActive(value: boolean | number | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return true
}

/** Render a compact summary of permissions regardless of shape (string | object). */
function permissionsSummary(raw: unknown): string {
  if (!raw) return 'None'
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return 'None'
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        if (parsed.includes('*')) return 'All permissions'
        return parsed.length ? `${parsed.length} permission(s)` : 'None'
      }
      if (parsed && typeof parsed === 'object') {
        const granted = Object.values(parsed).filter(Boolean).length
        return granted ? `${granted} granted` : 'None'
      }
    } catch {
      return trimmed
    }
  }
  if (typeof raw === 'object') {
    const granted = Object.values(raw as Record<string, unknown>).filter(
      Boolean
    ).length
    return granted ? `${granted} granted` : 'None'
  }
  return 'None'
}

function relativeTime(iso?: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Never'
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

// ── Component ───────────────────────────────────────────────────────────

function AdminsPage() {
  const { user } = usePlatformAuthStore()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const { data: response, isLoading } = useAdmins({ page, limit, search })
  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin()
  const deleteAdmin = useDeleteAdmin()
  const toggleActive = useToggleAdminActive()

  // Normalize raw response
  const normalized: AdminsResponse = (response ?? {}) as AdminsResponse
  const admins: AdminUser[] = normalized.data ?? []
  const pagination =
    normalized.pagination ??
    normalized.meta ?? { page: 1, limit, total: 0 }
  const totalPages =
    pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / limit))

  // Access guard
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">
          Only super admins can manage admin users.
        </p>
      </div>
    )
  }

  // Stats
  const totalAdmins = pagination.total
  const superAdmins = admins.filter((a) => a.role === 'super_admin').length
  const activeAdmins = admins.filter((a) => isActive(a.is_active)).length
  const inactiveAdmins = admins.filter((a) => !isActive(a.is_active)).length

  const stats = useMemo(
    () => [
      {
        label: 'Total Admins',
        value: totalAdmins,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Users className="w-6 h-6 text-white" />,
      },
      {
        label: 'Super Admins',
        value: superAdmins,
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <ShieldCheck className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active',
        value: activeAdmins,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive',
        value: inactiveAdmins,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ],
    [totalAdmins, superAdmins, activeAdmins, inactiveAdmins]
  )

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleToggleActive = (admin: AdminUser) => {
    toggleActive.mutate(admin.id)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteAdmin.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      })
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
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Admin Users Management
              </h1>
              <p className="text-sm text-white/80">
                Manage platform administrators, roles, and permissions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
        <Input
          placeholder="Search admins by name or email..."
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
      ) : admins.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search
              ? 'No admins found matching your search.'
              : 'No admin users have been created yet.'}
          </p>
          {!search && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Admin</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Permissions</th>
                <th className="px-4 py-3 text-left font-medium">Last Login</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const active = isActive(admin.is_active)
                return (
                  <tr
                    key={admin.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Admin */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {admin.thumb_url || admin.profile_image ? (
                          <img
                            src={
                              (admin.thumb_url ||
                                admin.profile_image ||
                                '') as string
                            }
                            alt={admin.name}
                            className="h-9 w-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-white text-sm font-semibold">
                            {(admin.name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {admin.name || '—'}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                          roleColorMap[admin.role] ?? 'bg-slate-400'
                        )}
                      >
                        {roleLabelMap[admin.role] ?? admin.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            active ? 'bg-emerald-500' : 'bg-slate-400'
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {permissionsSummary(admin.permissions)}
                      </span>
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(admin.last_login_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(admin)}
                          disabled={toggleActive.isPending}
                          title={active ? 'Deactivate' : 'Activate'}
                          className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          {active ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          <span className="ml-1.5 hidden sm:inline">
                            {active ? 'Deactivate' : 'Activate'}
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(admin)}
                          disabled={deleteAdmin.isPending}
                          title="Delete admin"
                          className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create Admin Dialog */}
      <CreateAdminDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={(payload) =>
          createAdmin.mutate(payload, {
            onSuccess: () => setShowCreateDialog(false),
          })
        }
        pending={createAdmin.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{' '}
              ({deleteTarget?.email}). They will no longer be able to access the
              admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAdmin.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAdmin.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAdmin.isPending ? (
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

// ── Inline Create Admin Dialog ──────────────────────────────────────────

interface CreateAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateAdminPayload) => void
  pending: boolean
}

function CreateAdminDialog({
  open,
  onOpenChange,
  onCreate,
  pending,
}: CreateAdminDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'super_admin' | 'admin' | 'viewer'>(
    'viewer'
  )

  const reset = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || password.length < 6) return
    onCreate({ name, email, password, role })
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Admin User</DialogTitle>
          <DialogDescription>
            Add a new admin user to the platform. They will receive access based
            on the assigned role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) =>
                setRole(v as 'super_admin' | 'admin' | 'viewer')
              }
            >
              <SelectTrigger id="admin-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
