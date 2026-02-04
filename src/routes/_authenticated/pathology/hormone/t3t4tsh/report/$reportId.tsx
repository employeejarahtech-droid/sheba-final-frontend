import { outdoorInvoices } from '@/data/data'
import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/t3t4tsh/report/$reportId',
)({
  component: T3T4TSHReport,
})

function T3T4TSHReport() {
  const { reportId } = Route.useParams()
  const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
  return (
    <>
      <ReportDetails invoice={invoice} testName="Thyroid Function Test (T3/T4/TSH) Report" />
    </>
  )
}
