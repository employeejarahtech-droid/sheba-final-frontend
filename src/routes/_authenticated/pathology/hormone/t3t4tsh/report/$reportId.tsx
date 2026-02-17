import T3T4TSHReportDetails from '@/features/pathology/special/T3T4TSHReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/t3t4tsh/report/$reportId',
)({
  component: T3T4TSHReport,
})

function T3T4TSHReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch T3T4TSH test data
    const { data: t3t4tshData, isLoading: isLoadingT3T4TSH, error: t3t4tshError } = useQuery({
        queryKey: ['t3t4tsh', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/t3t4tsh/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch T3T4TSH test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', t3t4tshData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${t3t4tshData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!t3t4tshData?.invoice_id,
    });

    if (isLoadingT3T4TSH || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (t3t4tshError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading T3T4TSH report: {(t3t4tshError as Error).message}</p>
            </div>
        );
    }

    return (
        <>
            <T3T4TSHReportDetails t3t4tshData={t3t4tshData} invoiceData={invoiceData} />
        </>
    )
}
