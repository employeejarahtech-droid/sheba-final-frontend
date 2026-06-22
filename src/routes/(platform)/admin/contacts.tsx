/**
 * Contacts Admin Page — Manage contact form submissions from the landing page
 *
 * Route: /(platform)/admin/contacts
 * Features: search, status filter, status-update select, assign to admin,
 * edit notes (dialog), delete with confirm, gradient stat cards, pagination.
 * Mirrors the companies.tsx purple-gradient visual pattern.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Mail,
  Search,
  Trash2,
  Activity,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  StickyNote,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useContacts,
  useUpdateContactStatus,
  useAssignContact,
  useUpdateContactNotes,
  useDeleteContact,
  useAdmins,
} from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/contacts')({
  component: ContactsPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface ContactRow {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company: string | null
  subject: string | null
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  notes: string | null
  assigned_to: number | null
  assigned_to_name?: string | null
  assigned_to_email?: string | null
  created_at: string
  updated_at?: string
}

interface AdminRow {
  id: number
  name: string
  email: string
}

interface ContactsResponse {
  success?: boolean
  data?: ContactRow[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

interface AdminsResponse {
  success?: boolean
  data?: AdminRow[]
}

// ── Status Maps ─────────────────────────────────────────────────────────

const CONTACT_STATUSES = ['new', 'in_progress', 'resolved', 'closed'] as const
type ContactStatus = (typeof CONTACT_STATUSES)[number]

const statusColorMap: Record<string, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-gray-400',
}

const statusLabelMap: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

// ── Component ───────────────────────────────────────────────────────────

function ContactsPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [notesContact, setNotesContact] = useState<ContactRow | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [viewContact, setViewContact] = useState<ContactRow | null>(null)
  const [deleteContact, setDeleteContact] = useState<ContactRow | null>(null)

  const statusParam = statusFilter === 'all' ? undefined : statusFilter

  const { data: response, isLoading } = useContacts({
    page,
    limit,
    search,
    status: statusParam,
  })
  const { data: adminsResponse } = useAdmins({ limit: 50 })

  const updateStatus = useUpdateContactStatus()
  const assignContact = useAssignContact()
  const updateNotes = useUpdateContactNotes()
  const removeContact = useDeleteContact()

  // Normalize response shape — RAW response: rows via .data, pagination via .pagination
  const normalized: ContactsResponse = (response as ContactsResponse) ?? {}
  const contacts: ContactRow[] = normalized.data ?? []
  const pagination = normalized.pagination ?? {
    page: 1,
    limit,
    total: 0,
  }
  const totalPages =
    pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / limit))

  const admins: AdminRow[] = ((adminsResponse as AdminsResponse)?.data) ?? []

  // Compute stats
  const newCount = contacts.filter((c) => c.status === 'new').length
  const inProgressCount = contacts.filter((c) => c.status === 'in_progress').length
  const resolvedCount = contacts.filter((c) => c.status === 'resolved').length

  const stats = useMemo(
    () => [
      {
        label: 'Total Contacts',
        value: pagination.total,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Mail className="w-6 h-6 text-white" />,
      },
      {
        label: 'New',
        value: newCount,
        gradient: 'from-sky-600 to-sky-400',
        shadow: 'shadow-sky-500/30',
        icon: <AlertCircle className="w-6 h-6 text-white" />,
      },
      {
        label: 'In Progress',
        value: inProgressCount,
        gradient: 'from-amber-600 to-amber-400',
        shadow: 'shadow-amber-500/30',
        icon: <Clock className="w-6 h-6 text-white" />,
      },
      {
        label: 'Resolved',
        value: resolvedCount,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      },
    ],
    [pagination.total, newCount, inProgressCount, resolvedCount]
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

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status })
  }

  const handleAssign = (id: number, assignedTo: number | null) => {
    assignContact.mutate({ id, assignedTo })
  }

  const openNotesDialog = (contact: ContactRow) => {
    setNotesContact(contact)
    setNotesValue(contact.notes ?? '')
  }

  const handleSaveNotes = () => {
    if (!notesContact) return
    updateNotes.mutate(
      { id: notesContact.id, notes: notesValue },
      {
        onSuccess: () => {
          setNotesContact(null)
        },
      }
    )
  }

  const confirmDelete = () => {
    if (!deleteContact) return
    removeContact.mutate(deleteContact.id, {
      onSuccess: () => setDeleteContact(null),
    })
  }

  const fullName = (c: ContactRow) =>
    `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'

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
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
              <p className="text-sm text-white/80">
                Review and manage contact form submissions
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
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['all', ...CONTACT_STATUSES].map((s) => (
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
              {s === 'all' ? 'All' : statusLabelMap[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-purple-500" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'No contacts found matching your filters.'
              : 'No contact submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{fullName(contact)}</p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.company || '—'}
                  </td>

                  {/* Subject */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.subject
                      ? contact.subject.length > 50
                        ? `${contact.subject.slice(0, 50)}…`
                        : contact.subject
                      : '—'}
                  </td>

                  {/* Status (select) */}
                  <td className="px-4 py-3">
                    <Select
                      value={contact.status}
                      onValueChange={(val) => handleStatusChange(contact.id, val)}
                    >
                      <SelectTrigger className="h-8 w-[150px] text-xs">
                        <span
                          className={cn(
                            'mr-1.5 inline-block h-2 w-2 rounded-full',
                            statusColorMap[contact.status] ?? 'bg-gray-400'
                          )}
                        />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabelMap[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Assigned To (select) */}
                  <td className="px-4 py-3">
                    <Select
                      value={
                        contact.assigned_to != null
                          ? String(contact.assigned_to)
                          : '__unassigned'
                      }
                      onValueChange={(val) =>
                        handleAssign(
                          contact.id,
                          val === '__unassigned' ? null : Number(val)
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned">Unassigned</SelectItem>
                        {admins.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {relativeDate(contact.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewContact(contact)}
                        title="View details"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNotesDialog(contact)}
                        title="Edit notes"
                        className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteContact(contact)}
                        disabled={removeContact.isPending}
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

      {/* View Dialog */}
      <Dialog
        open={!!viewContact}
        onOpenChange={(open) => !open && setViewContact(null)}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              Submission from {viewContact && fullName(viewContact)}
            </DialogDescription>
          </DialogHeader>
          {viewContact && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{viewContact.email || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{viewContact.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Company</span>
                  <p className="font-medium">{viewContact.company || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject</span>
                  <p className="font-medium">{viewContact.subject || '—'}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Message
                </p>
                <p className="whitespace-pre-wrap">{viewContact.message}</p>
              </div>
              {viewContact.notes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-1 text-xs font-medium text-amber-700">Notes</p>
                  <p className="whitespace-pre-wrap text-amber-900">
                    {viewContact.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog
        open={!!notesContact}
        onOpenChange={(open) => !open && setNotesContact(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Internal notes for {notesContact && fullName(notesContact)}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={6}
            placeholder="Add internal notes about this contact..."
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesContact(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={updateNotes.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateNotes.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteContact}
        onOpenChange={(open) => !open && setDeleteContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the submission from{' '}
              <strong>{deleteContact && fullName(deleteContact)}</strong>
              {deleteContact?.company && (
                <>
                  {' '}
                  at <strong>{deleteContact.company}</strong>
                </>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeContact.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={removeContact.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeContact.isPending ? (
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
