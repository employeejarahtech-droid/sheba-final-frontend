import StoolForREReportDetails from '@/features/pathology/stool/StoolForREReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/stool/stool-re/report/$reportId',
)({
  component: StoolForREReport,
})

function StoolForREReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  const { data: reportData, isLoading, error, isError } = useQuery({
    queryKey: ["stool-re", reportId],
    queryFn: async () => {
      console.log('Fetching stool-re report for ID:', reportId);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stool-re/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch stool R/E report: ${res.status} ${errorText}`);
      }

      const jsonData = await res.json();
      console.log('Report data:', jsonData);
      return jsonData;
    },
    enabled: !!token && !!reportId,
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isError || !reportData?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error ? (error as Error).message : 'Report not found. Please make sure the report exists and has been created.'}
            <br />
            <span className="text-xs">Report ID: {reportId}</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/pathology/stool/stool-re">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Stool R/E Reports
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
        <StoolForREReportDetails report={reportData.data} paddingTop={paddingTop} />
      </Main>
    </>
  )
}
