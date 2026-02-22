import ProthomBinTimeReportDetails from '@/features/pathology/hematology/prothom-bin-time/ProthomBinTimeReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'

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
           <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link to="/pathology/hematology/prothom-bin-time-full">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Prothom Bin Time Full
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
                <ProthomBinTimeReportDetails data={prothombinData?.data} />

            </Main>
        </>
    )
}
