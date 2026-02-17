import SputumReportDetails from '@/features/pathology/special/SputumReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/sputum/report/$reportId',
)({
  component: SputumReport,
})

function SputumReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch sputum test data
    const { data: sputumData, isLoading: isLoadingSputum, error: sputumError } = useQuery({
        queryKey: ['sputum', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sputum/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Sputum test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', sputumData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${sputumData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!sputumData?.invoice_id,
    });

    if (isLoadingSputum || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (sputumError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Sputum report: {(sputumError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <SputumReportDetails sputumData={sputumData} invoiceData={invoiceData} />
    </>
  )
}
