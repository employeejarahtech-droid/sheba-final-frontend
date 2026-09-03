import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ReportShell } from '@/features/prescriptions/components/ReportShell'
import { useDoctorWiseReportQuery } from '@/features/prescriptions/prescriptionsQueries'

const searchSchema = z.object({
  start_date: z.string().catch(''),
  end_date: z.string().catch(''),
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/reports/doctor-wise/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: DoctorWiseReportPage,
})

function DoctorWiseReportPage() {
  const { start_date, end_date, page, limit, search } = Route.useSearch()
  const navigate = Route.useNavigate()

  const params = {
    start_date: start_date || undefined,
    end_date: end_date || undefined,
  }
  const { data: rows, isFetching } = useDoctorWiseReportQuery(params)

  const set = (patch: Record<string, any>) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, ...patch }) })

  const columns = useMemo(() => [
    { data: 'doctor_name', title: 'Doctor', orderable: true },
    { data: 'total_prescriptions', title: 'Prescriptions', orderable: true },
    { data: 'total_items', title: 'Medicine Lines', orderable: true },
  ], [])

  return (
    <ReportShell
      title="Doctor-wise Prescription Report"
      subtitle="Prescription volume per doctor for the selected period"
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
