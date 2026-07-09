import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, FileText, Loader2, MinusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(public)/invoice-status/$invoiceId/')({
  component: InvoiceReportStatusPage,
})

type TestStatus = 'done' | 'pending' | 'n_a'

type ReportStatusData = {
  invoice_prefix: string | null
  patient_name: string
  delivery_date: string | null
  delivery_time: string | null
  invoice_date: string | null
  tests: { test_id: number; test_name: string; status: TestStatus }[]
  summary: { total: number; done: number; pending: number; all_done: boolean }
}

const STATUS_META: Record<TestStatus, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  done: { label: 'Ready', icon: CheckCircle2, classes: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  pending: { label: 'Pending', icon: Clock, classes: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  n_a: { label: 'No Report', icon: MinusCircle, classes: 'text-gray-400 bg-gray-50 dark:bg-gray-900/30' },
}

function InvoiceReportStatusPage() {
  const { invoiceId } = Route.useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-invoice-report-status', invoiceId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/outdoor-invoice/${invoiceId}/report-status`)
      if (!res.ok) throw new Error('Failed to fetch report status')
      const result = await res.json()
      return result.data as ReportStatusData
    },
    enabled: !!invoiceId,
    retry: false,
  })

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="p-3 bg-blue-600 rounded-full shadow-lg mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Report Status</h1>
          <p className="text-sm text-muted-foreground">Check whether your test reports are ready</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
          </div>
        ) : isError || !data ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Invoice not found. Please check the QR code or contact reception.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card
              className={cn(
                'mb-4 border-2 gap-0 p-0 overflow-hidden',
                data.summary.total === 0
                  ? 'border-gray-200'
                  : data.summary.all_done
                    ? 'border-emerald-500'
                    : 'border-amber-500',
              )}
            >
              <CardContent className="p-5 text-center">
                {data.summary.total === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">No lab reports to track for this invoice.</p>
                ) : data.summary.all_done ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">All Reports Ready</p>
                    <p className="text-sm text-muted-foreground mt-1">You can collect your report(s) now.</p>
                  </>
                ) : (
                  <>
                    <Clock className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {data.summary.done} of {data.summary.total} Ready
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Some reports are still being processed.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 p-0 overflow-hidden">
              <CardHeader className="border-b py-3 px-4 gap-0.5">
                <p className="text-sm font-semibold">{data.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  Invoice {data.invoice_prefix || `#${invoiceId}`}
                  {data.delivery_date ? ` · Delivery: ${new Date(data.delivery_date).toLocaleDateString()}${data.delivery_time ? ` ${data.delivery_time}` : ''}` : ''}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {data.tests.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No tests found on this invoice.</p>
                ) : (
                  <ul className="divide-y">
                    {data.tests.map((t) => {
                      const meta = STATUS_META[t.status]
                      const Icon = meta.icon
                      return (
                        <li key={t.test_id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <span className="text-sm font-medium">{t.test_name}</span>
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', meta.classes)}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
