
import { outdoorInvoices } from '@/data/data';
import BiochemistryReport from '@/routes/_authenticated/pathology/biochemical/all/report/ReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/biochemical/all/report/$reportId',
)({
    component: ReportDetails,
})


function ReportDetails() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));

    console.log(invoice)
    return (
        <>
            <BiochemistryReport invoice={invoice!} />
        </>
    )
}
