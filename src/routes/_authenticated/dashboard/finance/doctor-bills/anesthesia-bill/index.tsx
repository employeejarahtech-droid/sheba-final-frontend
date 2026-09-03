import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AnesthesiaBillPage } from '@/features/indoor/anesthesia-bill'

const anesthesiaBillSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
  status: z.string().catch('unpaid'),
  doctor: z.coerce.number().catch(0),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/finance/doctor-bills/anesthesia-bill/',
)({
  validateSearch: (search) => anesthesiaBillSearchSchema.parse(search),
  component: AnesthesiaBillPageRoute,
})

function AnesthesiaBillPageRoute() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 10
  const search = searchParams.search || ''
  const from = searchParams.from || ''
  const to = searchParams.to || ''
  const status = searchParams.status || 'unpaid'
  const doctor = Number(searchParams.doctor) || 0

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })

  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })

  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const setFrom = (newFrom: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) })

  const setTo = (newTo: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) })

  const setStatus = (newStatus: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) })

  const setDoctor = (newDoctor: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, doctor: newDoctor, page: 1 }) })

  return (
    <AnesthesiaBillPage
      page={page}
      limit={limit}
      search={search}
      from={from}
      to={to}
      status={status}
      doctor={doctor}
      setPage={setPage}
      setLimit={setLimit}
      setSearch={setSearch}
      setFrom={setFrom}
      setTo={setTo}
      setStatus={setStatus}
      setDoctor={setDoctor}
      payableOnly
    />
  )
}
