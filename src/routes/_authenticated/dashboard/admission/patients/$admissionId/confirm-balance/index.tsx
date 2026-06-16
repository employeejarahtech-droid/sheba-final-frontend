import { createFileRoute } from '@tanstack/react-router'
import { ConfirmBalancePage } from '@/features/admission/ConfirmBalancePage'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/$admissionId/confirm-balance/')({
    component: ConfirmBalancePageComponent,
})

function ConfirmBalancePageComponent() {
    const { admissionId } = Route.useParams()
    return (
        <>
            <AppHeader fixed />
            <Main>
                <ConfirmBalancePage admissionId={admissionId} />
            </Main>
        </>
    )
}
