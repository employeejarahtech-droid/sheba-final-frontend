import { createFileRoute } from '@tanstack/react-router'
import { BalanceDistributedListPage } from '@/features/admission/BalanceDistributedListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/balance-distributed-list/')({
    component: BalanceDistributedListPage,
})
