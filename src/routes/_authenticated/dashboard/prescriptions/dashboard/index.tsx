import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PrescriptionDashboard } from '@/features/prescriptions/dashboard'

const searchSchema = z.object({
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/dashboard/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PrescriptionDashboardRoute,
})

function PrescriptionDashboardRoute() {
  const searchParams: any = Route.useSearch()
  const navigate: any = Route.useNavigate()

  // The selected range lives in the URL (?from=&to=) so a dashboard view is
  // shareable/bookmarkable and survives back/forward navigation — same
  // convention as the main /dashboard page.
  const setRange = (from: string, to: string, replace = false) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from, to }), replace })

  return (
    <PrescriptionDashboard
      from={searchParams?.from || ''}
      to={searchParams?.to || ''}
      onRangeChange={setRange}
    />
  )
}
