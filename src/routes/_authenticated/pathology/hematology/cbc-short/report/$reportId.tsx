import { outdoorInvoices } from '@/data/data'
import CBCShortReportDetails from '@/features/pathology/hematology/cbc/CBCShortReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/cbc-short/report/$reportId',
)({
    component: CBCShortReport,
})

function CBCShortReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
    return (
        <>
            <CBCShortReportDetails invoice={invoice} />
        </>
    )
}
