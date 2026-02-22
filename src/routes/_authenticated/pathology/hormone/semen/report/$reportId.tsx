import SemenReportDetails from '@/features/pathology/special/SemenReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
    '/_authenticated/pathology/hormone/semen/report/$reportId',
)({
    component: SemenReport,
})

function SemenReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch semen test data
    const { data: semenData, isLoading: isLoadingSemen, error: semenError } = useQuery({
        queryKey: ['semen', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/semen/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Semen Analysis test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', semenData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${semenData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!semenData?.invoice_id,
    });

    if (isLoadingSemen || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (semenError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Semen Analysis report: {(semenError as Error).message}</p>
            </div>
        );
    }

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/hormone/semen">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Semen Tests
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
                <SemenReportDetails semenData={semenData} invoiceData={invoiceData} />
            </Main>
        </>
    )
}
