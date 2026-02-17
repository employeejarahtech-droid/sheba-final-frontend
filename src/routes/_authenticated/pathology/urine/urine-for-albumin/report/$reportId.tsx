import UrineForAlbuminReportDetails from '@/features/pathology/urine/UrineForAlbuminReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-albumin/report/$reportId',
)({
  component: UrineForAlbuminReport,
})

function UrineForAlbuminReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

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
      <UrineForAlbuminReportDetails urineAlbuminData={urineAlbuminData} invoiceData={invoiceData} />
    </>
  )
}
