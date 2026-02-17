import TuberculinMTReportDetails from '@/features/pathology/immunology/TuberculinMTReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/mt/report/$reportId',
)({
  component: TuberculinMTReport,
})

function TuberculinMTReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch MT test data
    const { data: mtData, isLoading: isLoadingMT, error: mtError } = useQuery({
        queryKey: ['mt', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/mt/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Tuberculin (MT) test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', mtData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${mtData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!mtData?.invoice_id,
    });

    if (isLoadingMT || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (mtError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading MT report: {(mtError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <TuberculinMTReportDetails mtData={mtData} invoiceData={invoiceData} />
    </>
  )
}
