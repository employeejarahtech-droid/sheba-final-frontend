import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ReportShell } from '@/features/prescriptions/components/ReportShell'
import { useMedicineWiseReportQuery } from '@/features/prescriptions/prescriptionsQueries'

const searchSchema = z.object({
  start_date: z.string().catch(''),
  end_date: z.string().catch(''),
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/reports/medicine-wise/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: MedicineWiseReportPage,
})

function MedicineWiseReportPage() {
  const { start_date, end_date, page, limit, search } = Route.useSearch()
  const navigate = Route.useNavigate()

  const params = {
    start_date: start_date || undefined,
    end_date: end_date || undefined,
  }
  const { data: rows, isFetching } = useMedicineWiseReportQuery(params)

  const set = (patch: Record<string, any>) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, ...patch }) })

  const columns = useMemo(() => [
    { data: 'medicine_name', title: 'Medicine', orderable: true },
    {
      data: 'generic_name', title: 'Generic', orderable: false,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    { data: 'times_prescribed', title: 'Times Prescribed', orderable: true },
  ], [])

  return (
    <ReportShell
      title="Medicine-wise Prescription Report"
      subtitle="Most-prescribed medicines and generics for the selected period"
      start={start_date}
      end={end_date}
      onStartChange={(v) => set({ start_date: v })}
      onEndChange={(v) => set({ end_date: v })}
      onReset={() => set({ start_date: '', end_date: '' })}
      rows={rows ?? []}
      columns={columns}
      isFetching={isFetching}
      page={page}
      limit={limit}
      search={search}
      onPageChange={(p) => set({ page: p })}
      onLimitChange={(l) => set({ limit: l, page: 1 })}
      onSearchChange={(s) => set({ search: s, page: 1 })}
    />
  )
}
