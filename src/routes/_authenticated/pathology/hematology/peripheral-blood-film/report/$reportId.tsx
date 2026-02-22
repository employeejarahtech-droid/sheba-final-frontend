import PeripheralBloodFilmReportDetails from '@/features/pathology/hematology/peripheral-blood-film/PeripheralBloodFilmReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/peripheral-blood-film/report/$reportId',
)({
    component: PeripheralBloodFilmReport,
})

function PeripheralBloodFilmReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

    // Fetch peripheral blood film test data
    const { data: reportData, isLoading, error } = useQuery({
        queryKey: ["peripheral-blood-report", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/peripheral-blood/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch Peripheral Blood Film report");
            return res.json();
        },
        enabled: !!token && !!reportId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Error loading Peripheral Blood Film report: {(error as Error).message}</p>
            </div>
        );
    }

    const invoice = reportData?.data;

    if (!invoice) {
        return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
    }

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/hematology/peripheral-blood-film">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Peripheral Blood Film
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
                <PeripheralBloodFilmReportDetails invoice={invoice} testName="Peripheral Blood Film (PBF) Report" />
            </Main>
        </>
    )
}
