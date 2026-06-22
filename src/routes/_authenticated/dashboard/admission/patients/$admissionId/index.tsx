import { createFileRoute } from '@tanstack/react-router'
import { AdmissionViewPage } from '@/features/admission/AdmissionViewPage'

export const Route = createFileRoute(
    '/_authenticated/dashboard/admission/patients/$admissionId/',
)({
    component: AdmissionViewComponent,
})

function AdmissionViewComponent() {
    const { admissionId } = Route.useParams()
    return <AdmissionViewPage admissionId={admissionId} />
}
