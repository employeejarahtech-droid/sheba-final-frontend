import { outdoorInvoices } from '@/data/data';
import BloodGroupReportDetails from '@/features/pathology/immunology/BloodGroupReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/blood-group/report/$reportId',
)({
  component: BloodGroupReport,
})

function BloodGroupReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <BloodGroupReportDetails invoice={invoice} />
    </>
  )
}
