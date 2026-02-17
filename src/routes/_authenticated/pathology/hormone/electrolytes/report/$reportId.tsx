import ElectrolytesReportDetails from '@/features/pathology/special/ElectrolytesReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/electrolytes/report/$reportId',
)({
  component: SerumElectrolytesReport,
})

function SerumElectrolytesReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch electrolytes test data
    const { data: electrolytesData, isLoading: isLoadingElectrolytes, error: electrolytesError } = useQuery({
        queryKey: ['electrolytes', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/electrolytes/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Serum Electrolytes test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', electrolytesData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${electrolytesData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!electrolytesData?.invoice_id,
    });

    if (isLoadingElectrolytes || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (electrolytesError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Electrolytes report: {(electrolytesError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <ElectrolytesReportDetails electrolytesData={electrolytesData} invoiceData={invoiceData} />
    </>
  )
}
