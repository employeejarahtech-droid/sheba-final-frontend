import { outdoorInvoices } from '@/data/data'
import WidalTestReportDetails from '@/features/pathology/immunology/WidalTestReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/widal-test/report/$reportId',
)({
  component: WidalTestReport,
})

function WidalTestReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
  return (
    <>
      <WidalTestReportDetails invoice={invoice} />
    </>
  )
}
