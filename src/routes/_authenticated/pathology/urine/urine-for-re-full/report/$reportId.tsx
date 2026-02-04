import { outdoorInvoices } from '@/data/data';
import UrineForReFullReportDetails from '@/features/pathology/urine/UrineForReFullReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-re-full/report/$reportId',
)({
  component: UrineForReFullReport,
})

function UrineForReFullReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <UrineForReFullReportDetails invoice={invoice} />
    </>
  )
}
