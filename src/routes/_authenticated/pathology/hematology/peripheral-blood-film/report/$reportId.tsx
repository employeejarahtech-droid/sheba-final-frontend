import PeripheralBloodFilmReportDetails from '@/features/pathology/hematology/peripheral-blood-film/PeripheralBloodFilmReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/peripheral-blood-film/report/$reportId',
)({
    component: PeripheralBloodFilmReport,
})

function PeripheralBloodFilmReport() {
    const { reportId } = Route.useParams();
    const token = getCookie('accessToken');

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
            <PeripheralBloodFilmReportDetails invoice={invoice} testName="Peripheral Blood Film (PBF) Report" />
        </>
    )
}
