import ReducingSubstanceReportDetails from '@/features/pathology/stool/ReducingSubstanceReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/reducing-substance/report/$reportId',
)({
  component: ReducingSubstanceReport,
})

function ReducingSubstanceReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch reducing substance test data
    const { data: reducingSubstanceData, isLoading: isLoadingReducingSubstance, error: reducingSubstanceError } = useQuery({
        queryKey: ['reducing-substance', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reducing-substance/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Reducing Substance test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', reducingSubstanceData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${reducingSubstanceData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reducingSubstanceData?.invoice_id,
    });

    if (isLoadingReducingSubstance || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (reducingSubstanceError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Reducing Substance report: {(reducingSubstanceError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <ReducingSubstanceReportDetails reducingSubstanceData={reducingSubstanceData} invoiceData={invoiceData} />
    </>
  )
}
