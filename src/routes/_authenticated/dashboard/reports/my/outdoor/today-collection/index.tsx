import ReportsMyOutdoorTodayCollection from '@/features/reports-my-outdoor-today-collection'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const todayCollectionSearchSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/my/outdoor/today-collection/')({
  validateSearch: (search) => todayCollectionSearchSchema.parse(search),
  component: TodayCollectionPage,
})

function TodayCollectionPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ""

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage === 1 ? undefined : newPage }) })
  }
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit === 10 ? undefined : newLimit, page: undefined }) })
  }
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch || undefined, page: undefined }) })
  }

  return (
    <ReportsMyOutdoorTodayCollection
      page={page}
      limit={limit}
      search={search}
      setPage={setPage}
      setLimit={setLimit}
      setSearch={setSearch}
    />
  )
}
