import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { UserRound, UserPlus, UserCheck } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { usePatientsQuery } from '@/features/prescriptions/patientsQueries'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/patients/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PrescriptionPatientsPage,
})

function PrescriptionPatientsPage() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = usePatientsQuery({ page, limit, search })

  const all = data?.rows ?? []
  const total = data?.total ?? 0

  const columns = useMemo(() => [
    {
      data: 'patient_no',
      title: 'Patient No',
      orderable: true,
      render: (d: any) =>
        d
          ? `<span class="font-mono text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-1 rounded">${d}</span>`
          : '<span class="text-muted-foreground">—</span>',
    },
    { data: 'name', title: 'Name', orderable: true },
    {
      data: 'age_years', title: 'Age / Sex', orderable: false,
      render: (_d: any, _t: string, row: any) => {
        const age = row.age_years != null ? `${row.age_years}y` : row.age_text || '—'
        const sex = row.sex ? ` · ${row.sex}` : ''
        return `<span>${age}${sex}</span>`
      },
    },
    { data: 'phone', title: 'Phone', orderable: true },
    {
      data: 'blood_group', title: 'Blood', orderable: false,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'allergies', title: 'Allergies', orderable: false,
      render: (d: any) => {
        if (!d || !d.length) return '<span class="text-muted-foreground">—</span>'
        return d
          .map((a: string) => `<span class="inline-block px-1.5 py-0.5 mr-1 text-[11px] font-semibold rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">${a}</span>`)
          .join('')
      },
    },
    {
      data: 'created_at', title: 'Registered', orderable: true,
      render: (d: any) => (d ? new Date(d).toLocaleDateString() : '—'),
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/prescriptions/patients/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">View</a>
          <a href="/dashboard/prescriptions/patients/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
        </div>`,
    },
  ], [])

  const cards = useMemo(() => ([
    { label: 'Total Patients', value: total, icon: UserRound, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Active (this page)', value: all.filter((p) => p.status !== 'inactive').length, icon: UserCheck, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'With Allergies (this page)', value: all.filter((p) => (p.allergies ?? []).length > 0).length, icon: UserPlus, gradientClass: 'from-red-500 to-rose-500 shadow-red-500/20' },
  ]), [all, total])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
            <p className="text-sm text-muted-foreground">Prescription module patient registry</p>
          </div>
          <Link to="/dashboard/prescriptions/patients/create"><Button>Add Patient</Button></Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={all}
          meta={{ page, limit, total }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
        />
      </Main>
    </>
  )
}
