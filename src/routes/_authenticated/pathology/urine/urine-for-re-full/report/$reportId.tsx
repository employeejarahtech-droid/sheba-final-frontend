import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { outdoorInvoices } from '@/data/data';
import UrineForReFullReportDetails from '@/features/pathology/urine/UrineForReFullReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-re-full/report/$reportId',
)({
  component: UrineForReFullReport,
})

function UrineForReFullReport() {
  const { reportId } = Route.useParams();
  const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/pathology/urine/urine-for-re-full">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Urine For R/E Full Tests
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <UrineForReFullReportDetails invoice={invoice} />
      </Main>

    </>
  )
}
