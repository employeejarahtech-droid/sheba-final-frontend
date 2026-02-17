import SkinScrappingForFungusReportDetails from '@/features/pathology/special/SkinScrappingForFungusReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/skin-scrapping-for-fungus/report/$reportId',
)({
  component: SkinScrappingForFungusReport,
})

function SkinScrappingForFungusReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch skin scraping test data
    const { data: skinScrappingData, isLoading: isLoadingSkinScrapping, error: skinScrappingError } = useQuery({
        queryKey: ['skin-scraping', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/skin-scraping/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Skin Scraping for Fungus test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', skinScrappingData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${skinScrappingData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!skinScrappingData?.invoice_id,
    });

    if (isLoadingSkinScrapping || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (skinScrappingError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Skin Scraping report: {(skinScrappingError as Error).message}</p>
            </div>
        );
    }

  return (
    <>
      <SkinScrappingForFungusReportDetails skinScrappingData={skinScrappingData} invoiceData={invoiceData} />
    </>
  )
}
