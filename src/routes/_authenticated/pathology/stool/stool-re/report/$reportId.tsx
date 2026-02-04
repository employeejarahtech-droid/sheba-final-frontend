import { outdoorInvoices } from '@/data/data';
import StoolForREReportDetails from '@/features/pathology/stool/StoolForREReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/stool-re/report/$reportId',
)({
  component: StoolForREReport,
})

function StoolForREReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <div>
      <StoolForREReportDetails invoice={invoice} />
    </div>
  )
}
