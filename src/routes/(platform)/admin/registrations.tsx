/**
 * Registrations Admin Page — Manage pending tenant registrations
 *
 * Route: /admin/registrations
 * Shows a paginated table with status filter tabs and search.
 * Actions: Approve (green) and Reject (red, opens RejectDialog).
 * Badge colors: pending=secondary, approved=default, rejected=destructive.
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  useRegistrations,
  useApproveRegistration,
} from '@/hooks/usePlatformAdmin'
import { RejectDialog } from '@/features/platform/registrations/components/RejectDialog'

export const Route = createFileRoute('/(platform)/admin/registrations')({
  component: RegistrationsAdminPage,
})

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
] as const

type StatusFilter = ''

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'default'
    case 'rejected':
      return 'destructive'
    case 'pending':
    default:
      return 'secondary'
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'approved':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return ''
  }
}

function RegistrationsAdminPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [rejectId, setRejectId] = useState<number | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const { data: registrationsData, isLoading } = useRegistrations({
    page,
    limit,
    search,
    status: statusFilter || undefined,
  })

  const approveRegistration = useApproveRegistration()

  const registrations = registrationsData?.data ?? []
  const pagination = registrationsData?.pagination

  const handleApprove = (id: number) => {
    approveRegistration.mutate(id)
  }

  const handleOpenReject = (id: number) => {
    setRejectId(id)
    setShowRejectDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
        <p className="text-muted-foreground">
          Review and manage tenant registration requests
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination?.total ?? registrations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter((r) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter((r) => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.value)
                setPage(1)
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search registrations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse text-muted-foreground" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || statusFilter
            ? 'No registrations match your filters.'
            : 'No registrations found.'}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Subdomain</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{reg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{reg.email}</td>
                  <td className="px-4 py-3">{reg.company_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{reg.subdomain}</td>
                  <td className="px-4 py-3">{reg.plan_name || reg.plan_slug || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={getStatusBadgeVariant(reg.status)}
                      className={getStatusBadgeClass(reg.status)}
                    >
                      {reg.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {reg.created_at
                      ? new Date(reg.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {reg.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(reg.id)}
                            disabled={approveRegistration.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenReject(reg.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        registrationId={rejectId}
      />
    </div>
  )
}
