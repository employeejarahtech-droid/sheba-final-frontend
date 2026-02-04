import { outdoorInvoices } from '@/data/data';
import UrineForAlbuminReportDetails from '@/features/pathology/urine/UrineForAlbuminReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-albumin/report/$reportId',
)({
  component: UrineForAlbuminReport,
})

function UrineForAlbuminReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <UrineForAlbuminReportDetails invoice={invoice} />
    </>
  )
}
