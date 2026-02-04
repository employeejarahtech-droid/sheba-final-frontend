import { outdoorInvoices } from '@/data/data'
import CBCWithPBFReportDetails from '@/features/pathology/hematology/cbc/CBCWithPBFReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/cbc-with-pbf/report/$reportId',
)({
    component: CBCWithPBFReport,
})

function CBCWithPBFReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
    return (
        <>
            <CBCWithPBFReportDetails invoice={invoice} />
        </>
    )
}
