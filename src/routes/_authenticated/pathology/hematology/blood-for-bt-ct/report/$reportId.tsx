import { outdoorInvoices } from '@/data/data'
import BloodForBtctReportDetails from '@/features/pathology/hematology/blood-for-bt-ct/_components/BloodForBtctReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/blood-for-bt-ct/report/$reportId',
)({
    component: BloodForBtctReport,
})

function BloodForBtctReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
    return (
        <div>
            <BloodForBtctReportDetails invoice={invoice} />
        </div>
    )
}
