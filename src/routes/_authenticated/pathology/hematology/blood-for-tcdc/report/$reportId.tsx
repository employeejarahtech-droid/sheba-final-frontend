import { outdoorInvoices } from '@/data/data';
import BloodForTcdcReportDetails from '@/features/pathology/hematology/blood-for-tcdc/BloodForTcdcReportDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/blood-for-tcdc/report/$reportId',
)({
    component: BloodForTcdcReport,
})

function BloodForTcdcReport() {
    const { reportId } = Route.useParams();
    const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));
    return (
        <>
            <BloodForTcdcReportDetails invoice={invoice!} />
        </>
    )
}
