import ProthomBinTimeReportDetails from '@/features/pathology/hematology/prothom-bin-time/ProthomBinTimeReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { useState } from 'react';

export const Route = createFileRoute(
    '/_authenticated/dashboard/pathology/hematology/prothom-bin-time-full/report/$reportId',
)({
    component: ProthomBinTimeReport,
})

function ProthomBinTimeReport() {
    const { reportId } = Route.useParams()
    const token = getCookie('accessToken')
    const [paddingTop, setPaddingTop] = useState(100);

    // Generate padding options from 10 to 200 in increments of 5
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

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
                    <Link to="/dashboard/hematology/prothom-bin-time-full">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Prothom Bin Time Full
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
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
                <ProthomBinTimeReportDetails data={prothombinData?.data} paddingTop={paddingTop} />

            </Main>
        </>
    )
}
