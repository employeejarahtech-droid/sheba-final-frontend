import UrineForAlbuminReportDetails from '@/features/pathology/urine/UrineForAlbuminReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/urine/urine-for-albumin/report/$reportId',
)({
  component: UrineForAlbuminReport,
})

function UrineForAlbuminReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');
    const [paddingTop, setPaddingTop] = useState(100);

    // Generate padding options from 10 to 200 in increments of 5
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

    // Fetch urine albumin test data
    const { data: urineAlbuminData, isLoading: isLoadingUrineAlbumin, error: urineAlbuminError } = useQuery({
        queryKey: ['urine-albumin', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/urine-albumin/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Urine Albumin test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', urineAlbuminData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${urineAlbuminData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!urineAlbuminData?.invoice_id,
    });

    if (isLoadingUrineAlbumin || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (urineAlbuminError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Urine Albumin report: {(urineAlbuminError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
    <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/urine/urine-for-albumin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Urine For Albumin Tests
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
      <UrineForAlbuminReportDetails urineAlbuminData={urineAlbuminData} invoiceData={invoiceData} paddingTop={paddingTop} />
        </Main>
    </>
  )
}
