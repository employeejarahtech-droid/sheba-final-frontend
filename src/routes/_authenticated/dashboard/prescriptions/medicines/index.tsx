import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Pill, ShieldAlert, DownloadCloud } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCan } from '@/hooks/use-can'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useRxMedicinesQuery,
  useMedicineGroupsQuery,
  useDeleteRxMedicineMutation,
  useImportFromPharmacyMutation,
} from '@/features/prescriptions/rxMedicinesQueries'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  group_id: z.coerce.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicines/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: RxMedicinesPage,
})

function RxMedicinesPage() {
  const can = useCan()
  const canEdit = can('prescriptions.edit')
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search
  const groupId = searchParams.group_id
  const debouncedSearch = useDebounce(search, 400)

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })
  const setGroup = (v: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, group_id: v === 'all' ? undefined : Number(v), page: 1 }) })

  const { data, isFetching } = useRxMedicinesQuery({
    page, limit, search: debouncedSearch || undefined,
    group_id: groupId, status: undefined,
  })
  const { data: groupsResult } = useMedicineGroupsQuery({ status: 'active', limit: 500 })
  const groups = groupsResult?.rows ?? []
  const del = useDeleteRxMedicineMutation()
  const importMut = useImportFromPharmacyMutation()
  const [importOpen, setImportOpen] = useState(false)

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-rx-med-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this medicine? Medicines already prescribed are deactivated instead.')) return
      try { await delRef.current.mutateAsync(id); toast.success('Medicine deleted / deactivated') }
      catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const rows = data?.rows ?? []
  const total = data?.total ?? 0

  const runImport = async () => {
    try {
      const res: any = await importMut.mutateAsync()
      const r = res?.data ?? res
      toast.success(
        `Import finished — ${r?.created ?? 0} added, ${r?.skipped ?? 0} skipped (already exist), ${r?.groups_created ?? 0} groups created`
      )
      setImportOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed (is the pharmacy module enabled?)')
    }
  }

  const columns = useMemo(() => [
    { data: 'name', title: 'Medicine', orderable: true },
    { data: 'generic_name', title: 'Generic', orderable: true },
    {
      data: 'manufacturer', title: 'Company', orderable: true,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'group_id', title: 'Group', orderable: false,
      render: (d: any, _t: string, row: any) =>
        row.group?.name
          ? `<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">${row.group.name}</span>`
          : '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'form', title: 'Form / Strength', orderable: false,
      render: (d: any, _t: string, row: any) =>
        [d, row.strength].filter(Boolean).join(' ') || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'default_dosage', title: 'Defaults', orderable: false,
      render: (d: any, _t: string, row: any) => {
        const parts = [d, row.default_frequency, row.default_duration].filter(Boolean)
        return parts.length
          ? `<span class="text-xs">${parts.join(' · ')}</span>`
          : '<span class="text-muted-foreground">—</span>'
      },
    },
    {
      data: 'is_controlled', title: 'Flags', orderable: false,
      render: (d: any, _t: string, row: any) => {
        const flags: string[] = []
        if (d) flags.push('<span class="px-1.5 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">CD</span>')
        if (row.caution_note) flags.push('<span class="px-1.5 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" title="' + String(row.caution_note).replace(/"/g, '&quot;') + '">⚠</span>')
        return flags.length ? flags.join(' ') : '<span class="text-muted-foreground">—</span>'
      },
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          ${canEdit ? `<a href="/dashboard/prescriptions/medicines/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          ${canEdit ? `<button type="button" class="js-rx-med-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>` : ''}
        </div>`,
    },
  ], [canEdit])

  const cards = useMemo(() => ([
    { label: 'Rx Medicines', value: total, icon: Pill, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Groups', value: groups.length, icon: Pill, gradientClass: 'from-purple-500 to-violet-500 shadow-purple-500/20' },
    { label: 'Controlled Drugs', value: rows.filter((m) => m.is_controlled).length, icon: ShieldAlert, gradientClass: 'from-red-500 to-rose-500 shadow-red-500/20' },
  ]), [total, groups.length, rows])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rx Medicines</h1>
            <p className="text-sm text-muted-foreground">Clinical medicine list used when prescribing</p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <DownloadCloud className="mr-2 h-4 w-4" /> Import from Pharmacy
              </Button>
              <Link to="/dashboard/prescriptions/medicines/create"><Button>Add Medicine</Button></Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
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
          filterSlot={
            <Select value={groupId ? String(groupId) : 'all'} onValueChange={setGroup}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All groups" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />

        <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import medicines from Pharmacy?</AlertDialogTitle>
              <AlertDialogDescription>
                Active pharmacy medicines are copied into the Rx list, grouped by their pharmacy category
                (categories are created as groups as needed). Medicines that already exist with the same name
                and strength are skipped. This does not touch pharmacy stock or prices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={importMut.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); runImport() }} disabled={importMut.isPending}>
                {importMut.isPending ? 'Importing…' : 'Import'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
