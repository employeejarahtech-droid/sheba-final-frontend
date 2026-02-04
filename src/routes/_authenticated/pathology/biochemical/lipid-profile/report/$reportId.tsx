import { outdoorInvoices } from '@/data/data';
import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/lipid-profile/report/$reportId',
)({
  component: LipidProfileReport,
})

function LipidProfileReport() {
    const { reportId } = Route.useParams();

    const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));
    
  return (
    <>
      <ReportDetails invoice={invoice!} testName="Lipid Profile Report" />
    </>
  )
}
