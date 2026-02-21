import CBCWithPBFReportDetails from '@/features/pathology/hematology/cbc/CBCWithPBFReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { topNav } from '@/data/data';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/cbc-with-pbf/report/$reportId',
)({
    component: CBCWithPBFReport,
})

function CBCWithPBFReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    const { data: reportData, isLoading, error } = useQuery({
        queryKey: ["cbc-pbf-report", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/cbc-pbf/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch CBC with PBF report");
            return res.json();
        },
        enabled: !!token && !!reportId,
    });

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">Error loading report</div>;
    }

    const invoice = reportData?.data;

    if (!invoice) {
        return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
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
                    <Link to="/pathology/hematology/cbc-with-pbf">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back to CBC with PBF
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print Report
                    </Button>
                </div>
                <CBCWithPBFReportDetails report={invoice} />
            </Main>
        </>
    )
}
