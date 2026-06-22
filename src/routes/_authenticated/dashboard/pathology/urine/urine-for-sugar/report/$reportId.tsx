import UrineForSugarFullReportDetails from '@/features/pathology/urine/UrineForSugarReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/urine/urine-for-sugar/report/$reportId',
)({
  component: UrineForSugarReport,
})

function UrineForSugarReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  // Fetch urine sugar report data
  const { data: reportData } = useQuery({
    queryKey: ["urine-sugar", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-sugar/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch urine sugar report");
      return res.json();
    },
    enabled: !!token && !!reportId,
  });

  // Fetch invoice data
  const { data: invoiceData } = useQuery({
    queryKey: ["invoice", reportData?.data?.invoice_id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${reportData?.data?.invoice_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: !!token && !!reportData?.data?.invoice_id,
  });

  const report = reportData?.data;
  const invoice = invoiceData?.data;

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/pathology/urine/urine-for-sugar">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Urine For Sugar Tests
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
        <UrineForSugarFullReportDetails report={report} invoice={invoice} paddingTop={paddingTop} />
      </Main>
    </>
  )
}

