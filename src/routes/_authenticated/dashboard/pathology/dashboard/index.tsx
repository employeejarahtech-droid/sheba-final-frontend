import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PathologyDashboardPage } from '@/features/pathology/dashboard'

const searchSchema = z.object({
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pathology/dashboard/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PathologyDashboardRoute,
})

function PathologyDashboardRoute() {
  const searchParams: any = Route.useSearch()
  const navigate: any = Route.useNavigate()

  // The selected range lives in the URL (?from=&to=) so a dashboard view is
  // shareable/bookmarkable and survives back/forward navigation — same
  // convention as the other dashboard pages.
  const setRange = (from: string, to: string, replace = false) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from, to }), replace })

  return (
    <PathologyDashboardPage
      from={searchParams?.from || ''}
      to={searchParams?.to || ''}
      onRangeChange={setRange}
    />
  )
}
