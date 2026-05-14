import { createFileRoute } from '@tanstack/react-router'
import { BillCreatedListPage } from '@/features/admission/BillCreatedListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/bill-created-list/')({
    component: BillCreatedListPage,
})
