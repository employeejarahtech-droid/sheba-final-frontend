import { createFileRoute } from '@tanstack/react-router'
import { AdmittedPatientsList } from '@/features/admission/AdmittedPatientsList'

export const Route = createFileRoute('/_authenticated/admission/patients/')({
    component: AdmittedPatientsList,
})
