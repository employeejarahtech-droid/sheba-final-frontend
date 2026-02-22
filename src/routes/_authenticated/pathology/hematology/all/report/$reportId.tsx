import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { outdoorInvoices } from '@/data/data';
import HematologyReportDetails from '@/features/pathology/hematology/all-reports/HematologyReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/all/report/$reportId',
)({
  component: HematologyAllReports,
})

function HematologyAllReports() {
  const { reportId } = Route.useParams();

  const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));
  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/pathology/hematology/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <HematologyReportDetails invoice={invoice!} />
      </Main>
    </>
  )
}
