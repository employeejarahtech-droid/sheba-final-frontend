import { createFileRoute } from '@tanstack/react-router'
import { BillingPrintPage } from '@/features/admission/BillingPrintPage'

export const Route = createFileRoute('/_authenticated/admission/patients/$admissionId/billing-print/')({
    component: BillingPrintPage,
})
