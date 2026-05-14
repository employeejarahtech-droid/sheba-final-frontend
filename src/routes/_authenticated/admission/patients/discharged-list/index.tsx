import { createFileRoute } from '@tanstack/react-router'
import { DischargedPatientListPage } from '@/features/admission/DischargedPatientListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/discharged-list/')({
    component: DischargedPatientListPage,
})
