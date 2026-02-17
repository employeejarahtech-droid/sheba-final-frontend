import ProthomBinTimeReportDetails from '@/features/pathology/hematology/prothom-bin-time/ProthomBinTimeReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/prothom-bin-time-full/report/$reportId',
)({
    component: ProthomBinTimeReport,
})

function ProthomBinTimeReport() {
    const { reportId } = Route.useParams()
    const token = getCookie('accessToken')

    const { data: prothombinData, isLoading } = useQuery({
        queryKey: ['prothombin-time', reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/prothombin-time/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            if (!res.ok) throw new Error('Failed to fetch prothombin time report')
            return res.json()
        },
        enabled: !!token && !!reportId,
    })

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    return (
        <>
            <ProthomBinTimeReportDetails data={prothombinData?.data} />
        </>
    )
}
