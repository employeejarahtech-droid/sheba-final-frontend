import TuberculinMTReportDetails from '@/features/pathology/immunology/TuberculinMTReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { topNav } from '@/data/data';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute(
    '/_authenticated/pathology/immunology/mt/report/$reportId',
)({
    component: TuberculinMTReport,
})

function TuberculinMTReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

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
            <Header fixed className="print:hidden">
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/immunology/mt">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to MT Tests
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
                <TuberculinMTReportDetails mtData={mtData} invoiceData={invoiceData} />
            </Main>
        </>
    )
}
