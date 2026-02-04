import { outdoorInvoices } from '@/data/data';
import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/skin-scrapping-for-fungus/report/$reportId',
)({
  component: SkinScrappingForFungusReport,
})

function SkinScrappingForFungusReport() {
  const { reportId } = Route.useParams();
  const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <ReportDetails invoice={invoice} testName="Skin Scrapping For Fungus Report" />
    </>
  )
}
