import BloodForBtctReportDetails from '@/features/pathology/hematology/blood-for-bt-ct/_components/BloodForBtctReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/blood-for-bt-ct/report/$reportId',
)({
    component: BloodForBtctReport,
})

function BloodForBtctReport() {
    const { reportId } = Route.useParams()
    const token = getCookie('accessToken');

    const { data: reportData, isLoading, error } = useQuery({
        queryKey: ["btct-report", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/btct/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch BT/CT report");
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
            <BloodForBtctReportDetails invoice={invoice} testName="Blood For BT/CT Report" />
        </>
    )
}
