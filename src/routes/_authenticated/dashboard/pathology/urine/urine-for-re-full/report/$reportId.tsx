import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { outdoorInvoices } from '@/data/data';
import UrineForReFullReportDetails from '@/features/pathology/urine/UrineForReFullReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/urine/urine-for-re-full/report/$reportId',
)({
  component: UrineForReFullReport,
})

function UrineForReFullReport() {
  const { reportId } = Route.useParams();
  const invoice = outdoorInvoices.find((item) => item.id === Number(reportId));
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/urine/urine-for-re-full">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Urine For R/E Full Tests
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="padding-select" className="text-sm font-medium">Padding Top:</label>
              <select
                id="padding-select"
                value={paddingTop}
                onChange={(e) => setPaddingTop(Number(e.target.value))}
                className="h-8 px-2 text-sm border rounded-md bg-background"
              >
                {paddingOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}px
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
        <UrineForReFullReportDetails invoice={invoice} paddingTop={paddingTop} />
      </Main>

    </>
  )
}
