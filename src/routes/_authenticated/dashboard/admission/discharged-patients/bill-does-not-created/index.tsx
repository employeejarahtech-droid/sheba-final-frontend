import { createFileRoute } from '@tanstack/react-router'
import { BillNotCreatedListPage } from '@/features/admission/BillNotCreatedListPage'

export const Route = createFileRoute('/_authenticated/dashboard/admission/discharged-patients/bill-does-not-created/')({
    component: BillNotCreatedListPage,
})
