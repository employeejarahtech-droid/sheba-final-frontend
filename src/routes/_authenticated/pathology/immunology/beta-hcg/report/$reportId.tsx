import BetaHCGReportDetails from '@/features/pathology/immunology/BetaHCGReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';

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
            <AppHeader fixed />
            <Main>
                <div className="mb-4 print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/immunology/beta-hcg">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Beta HCG Tests
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
                <BetaHCGReportDetails hcgData={hcgData} invoiceData={invoiceData} />
            </Main>
        </>
    )
}
