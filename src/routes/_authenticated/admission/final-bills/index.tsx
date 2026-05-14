import { createFileRoute } from '@tanstack/react-router'
import { FinalBillsListPage } from '@/features/admission/FinalBillsListPage'

export const Route = createFileRoute('/_authenticated/admission/final-bills/')({
    component: FinalBillsListPage,
})
