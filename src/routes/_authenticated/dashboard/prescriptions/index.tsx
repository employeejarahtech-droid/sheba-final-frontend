import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { usePrescriptionsQuery, useCancelPrescriptionMutation } from '@/features/prescriptions/prescriptionsQueries'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCan } from '@/hooks/use-can'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PrescriptionsPage,
})

function PrescriptionsPage() {
  const can = useCan()
  const canCancel = can('prescriptions.edit')
  const { formatDateTime } = useDateFormat()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = usePrescriptionsQuery({ page, limit, search })
  const cancel = useCancelPrescriptionMutation()

  const cancelRef = useRef(cancel)
  cancelRef.current = cancel
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-rx-cancel') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      const reason = window.prompt('Reason for cancelling this prescription (optional):') || undefined
      if (reason === undefined && !window.confirm('Cancel this prescription?')) return
      try { await cancelRef.current.mutateAsync({ id, reason }); toast.success('Prescription cancelled') }
      catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to cancel') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const rows = data?.rows || []
  const total = data?.total || 0

  const columns = useMemo(() => [
    {
      data: 'prescription_no',
      title: 'Rx No',
      orderable: true,
      render: (d: any, _t: string, row: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${d || `#${row.id}`}</span>`,
    },
    {
      data: 'patient_name', title: 'Patient', orderable: true,
      render: (d: any, _t: string, row: any) =>
        row.patient_id
          ? `<a href="/dashboard/prescriptions/patients/${row.patient_id}" class="text-blue-600 hover:underline">${d}</a>`
          : d,
    },
    { data: null, title: 'Doctor', orderable: false, render: (_d: any, _t: string, row: any) => row?.doctor?.name || `#${row.doctor_id}` },
    { data: 'created_at', title: 'Date', orderable: true, render: (d: any) => formatDateTime(d) },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/prescriptions/${row.id}/print" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">View / Print</a>
          ${canCancel && row.status === 'active' ? `<a href="/dashboard/prescriptions/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          ${canCancel && row.status === 'active' ? `<button type="button" class="js-rx-cancel inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Cancel</button>` : ''}
        </div>`,
    },
  ], [canCancel, formatDateTime])

  const activeCount = rows.filter((r) => r.status === 'active').length
  const cancelledCount = rows.filter((r) => r.status === 'cancelled').length

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6 text-blue-600" />Prescriptions</h1>
            <p className="text-sm text-muted-foreground">{total} total · {activeCount} active on this page · {cancelledCount} cancelled on this page</p>
          </div>
          <Link to="/dashboard/prescriptions/create"><Button><FileText className="h-4 w-4 mr-1" />New Prescription</Button></Link>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          meta={{ page, limit, total }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
        />
      </main>
    </>
  )
}
