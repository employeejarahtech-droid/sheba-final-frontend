import { createFileRoute } from '@tanstack/react-router'
import { BillDistributionPage } from '@/features/admission/BillDistributionPage'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/admission/patients/$admissionId/distribute-bill/')({
    component: BillDistributionPageComponent,
})

function BillDistributionPageComponent() {
    const { admissionId } = Route.useParams()
    return (
        <>
            <AppHeader fixed />
            <Main>
                <BillDistributionPage admissionId={admissionId} />
            </Main>
        </>
    )
}
