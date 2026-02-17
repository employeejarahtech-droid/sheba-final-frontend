import BetaHCGReportDetails from '@/features/pathology/immunology/BetaHCGReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/beta-hcg/report/$reportId',
)({
  component: BetaHCGReport,
})

function BetaHCGReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch HCG test data
    const { data: hcgData, isLoading: isLoadingHCG, error: hcgError } = useQuery({
        queryKey: ['hcg', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/hcg/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Beta HCG test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', hcgData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${hcgData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!hcgData?.invoice_id,
    });

    if (isLoadingHCG || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (hcgError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading HCG report: {(hcgError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <BetaHCGReportDetails hcgData={hcgData} invoiceData={invoiceData} />
    </>
  )
}
