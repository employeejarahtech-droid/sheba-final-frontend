import { createFileRoute } from '@tanstack/react-router'
import { BillCreatedPage } from '@/features/admission/BillCreatedPage'

export const Route = createFileRoute('/_authenticated/admission/patients/$admissionId/bill-created/')({
    component: BillCreatedPage,
})
