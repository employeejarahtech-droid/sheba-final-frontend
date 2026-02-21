import { createFileRoute } from '@tanstack/react-router'
import { PatientBillingPage } from '@/features/admission/PatientBillingPage'

export const Route = createFileRoute('/_authenticated/admission/patients/$admissionId/billing/')({
    component: PatientBillingPage,
})
