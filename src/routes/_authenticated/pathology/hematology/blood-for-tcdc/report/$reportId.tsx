import BloodForTcdcReportDetails from '@/features/pathology/hematology/blood-for-tcdc/BloodForTcdcReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { topNav } from '@/data/data';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/blood-for-tcdc/report/$reportId',
)({
    component: BloodForTcdcReport,
})

function BloodForTcdcReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    const { data: reportData, isLoading, error } = useQuery({
        queryKey: ["tcdc-report", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tcdc/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch TCDC report");
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
                <div className="mb-4 print:hidden">
                    <Link to="/pathology/hematology/blood-for-tcdc">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blood For TCDC
                        </Button>
                    </Link>
                </div>
                <BloodForTcdcReportDetails invoice={invoice} testName="Blood For TCDC Report" />
            </Main>
        </>
    )
}
