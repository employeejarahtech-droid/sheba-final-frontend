import TuberculinMTReportDetails from '@/features/pathology/immunology/TuberculinMTReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { useState } from 'react';

export const Route = createFileRoute(
    '/_authenticated/dashboard/pathology/immunology/mt/report/$reportId',
)({
    component: TuberculinMTReport,
})

function TuberculinMTReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');
    const [paddingTop, setPaddingTop] = useState(100);

    // Generate padding options from 10 to 200 in increments of 5
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

    // Fetch MT test data
    const { data: mtData, isLoading: isLoadingMT, error: mtError } = useQuery({
        queryKey: ['mt', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/mt/${reportId}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch Tuberculin (MT) test report');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    // Fetch invoice data
    const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ['outdoor-invoice', mtData?.invoice_id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${mtData.invoice_id}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch invoice details');
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!mtData?.invoice_id,
    });

    if (isLoadingMT || isLoadingInvoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (mtError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading MT report: {(mtError as Error).message}</p>
            </div>
        );
    }

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/dashboard/pathology/immunology/mt">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to MT Tests
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="padding-select" className="text-sm font-medium">Padding Top:</label>
                            <select
                                id="padding-select"
                                value={paddingTop}
                                onChange={(e) => setPaddingTop(Number(e.target.value))}
                                className="h-8 px-2 text-sm border rounded-md bg-background"
                            >
                                {paddingOptions.map((value) => (
                                    <option key={value} value={value}>
                                        {value}px
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
                <TuberculinMTReportDetails mtData={mtData} invoiceData={invoiceData} paddingTop={paddingTop} />
            </Main>
        </>
    )
}
