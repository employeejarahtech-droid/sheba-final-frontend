import { outdoorInvoices } from '@/data/data';
import HematologyReportDetails from '@/features/pathology/hematology/all-reports/HematologyReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/all/report/$reportId',
)({
  component: HematologyAllReports,
})

function HematologyAllReports() {
    const { reportId } = Route.useParams();

    const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));
  return (
    <>
      <HematologyReportDetails invoice={invoice!} />
    </>
  )
}
