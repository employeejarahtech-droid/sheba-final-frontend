import { createFileRoute } from '@tanstack/react-router'
import { IndoorBillReport, type IndoorBillReportConfig } from '@/features/indoor/reports/indoor-bill-report'

const config: IndoorBillReportConfig = {
  endpoint: 'assistant',
  title: 'Assistant Bill',
  providerLabel: 'Assistant',
  printPath: '/dashboard/reports/indoor/assistant-bill/print',
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/indoor/assistant-bill/')({
  component: ReportPage,
})

function ReportPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ''
  const from = searchParams?.from || ''
  const to = searchParams?.to || ''
  const status = searchParams?.status || 'all'

  const setSearchParam = (patch: Record<string, unknown>) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, ...patch }) })

  return (
    <IndoorBillReport
      config={config}
      page={page}
      limit={limit}
      search={search}
      from={from}
      to={to}
      status={status}
      setPage={(p) => setSearchParam({ page: p })}
      setLimit={(l) => setSearchParam({ limit: l, page: 1 })}
      setSearch={(s) => setSearchParam({ search: s, page: 1 })}
      setFrom={(f) => setSearchParam({ from: f, page: 1 })}
      setTo={(t) => setSearchParam({ to: t, page: 1 })}
      setStatus={(s) => setSearchParam({ status: s, page: 1 })}
    />
  )
}
