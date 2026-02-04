import { outdoorInvoices } from '@/data/data';
import BetaHCGReportDetails from '@/features/pathology/immunology/BetaHCGReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/beta-hcg/report/$reportId',
)({
  component: BetaHCGReport,
})

function BetaHCGReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <BetaHCGReportDetails invoice={invoice} />
    </>
  )
}
