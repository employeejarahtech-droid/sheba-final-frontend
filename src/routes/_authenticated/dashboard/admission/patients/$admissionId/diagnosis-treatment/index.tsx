import { createFileRoute } from '@tanstack/react-router'
import { DiagnosisTreatmentPage } from '@/features/admission/DiagnosisTreatmentPage'

export const Route = createFileRoute(
    '/_authenticated/dashboard/admission/patients/$admissionId/diagnosis-treatment/',
)({
    component: DiagnosisTreatmentComponent,
})

function DiagnosisTreatmentComponent() {
    const { admissionId } = Route.useParams()
    return <DiagnosisTreatmentPage admissionId={admissionId} />
}
