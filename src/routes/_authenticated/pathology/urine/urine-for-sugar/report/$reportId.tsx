import { outdoorInvoices } from '@/data/data';
import UrineForSugarFullReportDetails from '@/features/pathology/urine/UrineForSugarReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-sugar/report/$reportId',
)({
  component: UrineForSugarReport,
})

function UrineForSugarReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <UrineForSugarFullReportDetails invoice={invoice} />    
    </>
  )
}
