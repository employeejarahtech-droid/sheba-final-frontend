import { createFileRoute } from '@tanstack/react-router'
import { PaymentCompletedListPage } from '@/features/admission/PaymentCompletedListPage'

export const Route = createFileRoute('/_authenticated/admission/patients/payment-completed-list/')({
    component: PaymentCompletedListPage,
})
