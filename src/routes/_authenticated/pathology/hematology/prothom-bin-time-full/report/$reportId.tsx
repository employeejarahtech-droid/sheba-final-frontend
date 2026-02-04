import { outdoorInvoices } from '@/data/data'
import ProthomBinTimeReportDetails from '@/features/pathology/hematology/prothom-bin-time/ProthomBinTimeReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/prothom-bin-time-full/report/$reportId',
)({
    component: ProthomBinTimeReport,
})

function ProthomBinTimeReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
    return (
        <>
            <ProthomBinTimeReportDetails invoice={invoice} />
        </>
    )
}
