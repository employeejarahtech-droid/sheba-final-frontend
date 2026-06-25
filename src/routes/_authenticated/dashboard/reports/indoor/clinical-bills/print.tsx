import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { IndoorBillReportPrint } from '@/features/indoor/reports/indoor-bill-report-print'
import type { IndoorBillReportConfig } from '@/features/indoor/reports/indoor-bill-report'

const config: IndoorBillReportConfig = {
  endpoint: 'clinical-service',
  title: 'Clinical Bills',
  providerLabel: 'Service',
  printPath: '/dashboard/reports/indoor/clinical-bills/print',
}

const searchSchema = z.object({
  search: z.string().optional().default(''),
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
  status: z.string().optional().default('all'),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/indoor/clinical-bills/print')({
  validateSearch: searchSchema,
  component: ReportPrintPage,
})

function ReportPrintPage() {
  const { search, from, to, status } = Route.useSearch()
  return <IndoorBillReportPrint config={config} search={search} from={from} to={to} status={status} />
}
