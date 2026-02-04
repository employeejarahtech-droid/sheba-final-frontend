import { outdoorInvoices } from '@/data/data';
import TuberculinMTReportDetails from '@/features/pathology/immunology/TuberculinMTReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/mt/report/$reportId',
)({
  component: TuberculinMTReport,
})

function TuberculinMTReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <><TuberculinMTReportDetails invoice={invoice} /></>
  )
}
