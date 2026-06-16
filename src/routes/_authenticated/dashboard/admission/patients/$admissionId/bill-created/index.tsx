import { createFileRoute } from '@tanstack/react-router'
import { BillCreatedPage } from '@/features/admission/BillCreatedPage'

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/$admissionId/bill-created/')({
    component: BillCreatedPage,
})
