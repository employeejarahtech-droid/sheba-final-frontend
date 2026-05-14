import { createFileRoute } from '@tanstack/react-router'
import { BillsDistributedListPage } from '@/features/admission/BillsDistributedListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/bill-distributed-list/')({
    component: BillsDistributedListPage,
})
