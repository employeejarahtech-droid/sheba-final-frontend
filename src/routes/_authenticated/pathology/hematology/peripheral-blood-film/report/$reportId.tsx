import { outdoorInvoices } from '@/data/data'
import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/peripheral-blood-film/report/$reportId',
)({
    component: PeripheralBloodFilmReport,
})

function PeripheralBloodFilmReport() {
    const { reportId } = Route.useParams()
    const invoice = outdoorInvoices.find((invoice) => invoice.id === Number(reportId))
    return (
        <>
            <ReportDetails invoice={invoice} testName="PERIPHERAL BLOOD FILM (PBF) REPORT" />
        </>
    )
}
