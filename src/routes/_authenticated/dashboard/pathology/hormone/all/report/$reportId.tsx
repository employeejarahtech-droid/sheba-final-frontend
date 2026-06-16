import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import HormoneReportDetails from '@/features/pathology/hormone/all-reports/HormoneReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hormone/all/report/$reportId',
)({
  component: HormoneAllReports,
})

function HormoneAllReports() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["hormone-report", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hormon-all/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch hormone report");
      return res.json();
    },
    enabled: !!token && !!reportId,
  });

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen">Loading...</div>
        </Main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen text-red-500">Error loading report</div>
        </Main>
      </>
    );
  }

  const invoice = reportData?.data;

  if (!invoice) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center min-h-screen">Report not found</div>
        </Main>
      </>
    );
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/hormone/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
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
        <HormoneReportDetails invoice={invoice} testName="Hormone Report" paddingTop={paddingTop} />
      </Main>
    </>
  )
}
