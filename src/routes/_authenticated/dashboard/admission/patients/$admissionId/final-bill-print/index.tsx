import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { FinalBillPrintPage } from '@/features/admission/FinalBillPrintPage'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute(
    '/_authenticated/dashboard/admission/patients/$admissionId/final-bill-print/',
)({
    component: FinalBillPrintRoute,
})

function FinalBillPrintRoute() {
    const { admissionId } = Route.useParams()
    const token = getCookie('accessToken')

    // Fetch final bill
    const { data: finalBillData, isLoading, error } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Final bill not found. Please create the final bill first.')
                }
                throw new Error('Failed to fetch final bill')
            }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch distributions (bill heads)
    const { data: distributionsData } = useQuery({
        queryKey: ['distributions-print', admissionId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bill-distribution/admission/${admissionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const finalBill = finalBillData?.data || null
    const distributions: any[] = distributionsData?.data || []

    if (isLoading) {
        return (
            <>
                <AppHeader fixed className="print:hidden" />
                <Main>
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading final bill...</p>
                        </div>
                    </div>
                </Main>
            </>
        )
    }

    if (error || !finalBill) {
        return (
            <>
                <AppHeader fixed className="print:hidden" />
                <Main>
                    <div className="space-y-6">
                        <div className="print:hidden flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </div>
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center">
                                <p className="text-red-500">
                                    {error instanceof Error ? error.message : 'Final bill not found'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Main>
            </>
        )
    }

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <FinalBillPrintPage
                    finalBill={finalBill}
                    distributions={distributions}
                />
            </Main>
        </>
    )
}
