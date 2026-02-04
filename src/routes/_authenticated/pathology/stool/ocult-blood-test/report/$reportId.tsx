import { outdoorInvoices } from '@/data/data';
import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/ocult-blood-test/report/$reportId',
)({
  component: OcultBloodTestReport,
})

function OcultBloodTestReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <ReportDetails invoice={invoice} testName="Ocult Blood Test Report" />
    </>
  )
}
