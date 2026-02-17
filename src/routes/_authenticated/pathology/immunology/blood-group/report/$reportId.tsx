import BloodGroupReportDetails from '@/features/pathology/immunology/BloodGroupReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/blood-group/report/$reportId',
)({
  component: BloodGroupReport,
})

function BloodGroupReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch blood group test data
    const { data: bloodGroupData, isLoading: isLoadingBloodGroup, error: bloodGroupError } = useQuery({
        queryKey: ['blood-group', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/blood-group/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Blood Group test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', bloodGroupData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${bloodGroupData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!bloodGroupData?.invoice_id,
    });

    if (isLoadingBloodGroup || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (bloodGroupError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading blood group report: {(bloodGroupError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <BloodGroupReportDetails bloodGroupData={bloodGroupData} invoiceData={invoiceData} />
    </>
  )
}
