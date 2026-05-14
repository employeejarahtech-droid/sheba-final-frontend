import { createFileRoute } from '@tanstack/react-router'
import { FinalBillCreatedListPage } from '@/features/admission/FinalBillCreatedListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/final-bill-created-list/')({
    component: FinalBillCreatedListPage,
})
