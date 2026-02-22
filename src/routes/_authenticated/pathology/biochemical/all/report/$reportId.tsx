
import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { outdoorInvoices } from '@/data/data';
import BiochemistryReport from '@/routes/_authenticated/pathology/biochemical/all/report/ReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';

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
            <AppHeader fixed/>

            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/biochemical/all">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to All Reports
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
                <BiochemistryReport invoice={invoice!} />
            </Main>
        </>
    )
}
