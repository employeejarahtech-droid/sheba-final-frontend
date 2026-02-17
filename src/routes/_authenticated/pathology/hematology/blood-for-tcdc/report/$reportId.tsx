import BloodForTcdcReportDetails from '@/features/pathology/hematology/blood-for-tcdc/BloodForTcdcReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';

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
            <BloodForTcdcReportDetails invoice={invoice} testName="Blood For TCDC Report" />
        </>
    )
}
