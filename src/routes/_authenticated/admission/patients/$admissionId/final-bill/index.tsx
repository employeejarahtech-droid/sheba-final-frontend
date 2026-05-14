import { createFileRoute } from '@tanstack/react-router'
import { FinalBillPage } from '@/features/admission/FinalBillPage'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/admission/patients/$admissionId/final-bill/')({
    component: FinalBillPageComponent,
})

function FinalBillPageComponent() {
    const { admissionId } = Route.useParams()
    return (
        <>
            <AppHeader fixed />
            <Main>
                <FinalBillPage admissionId={admissionId} />
            </Main>
        </>
    )
}
