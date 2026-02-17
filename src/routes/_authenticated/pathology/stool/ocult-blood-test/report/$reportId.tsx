import OccultBloodTestReportDetails from '@/features/pathology/stool/OccultBloodTestReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/ocult-blood-test/report/$reportId',
)({
  component: OcultBloodTestReport,
})

function OcultBloodTestReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch occult blood test data
    const { data: occultBloodData, isLoading: isLoadingOccultBlood, error: occultBloodError } = useQuery({
        queryKey: ['occult-blood', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/occult-blood/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Occult Blood test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', occultBloodData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${occultBloodData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!occultBloodData?.invoice_id,
    });

    if (isLoadingOccultBlood || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (occultBloodError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Occult Blood report: {(occultBloodError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <OccultBloodTestReportDetails occultBloodData={occultBloodData} invoiceData={invoiceData} />
    </>
  )
}
