import { createFileRoute } from '@tanstack/react-router'
import { PaymentAccountSettings } from '@/features/settings/payment-accounts'

export const Route = createFileRoute('/_authenticated/dashboard/settings/payment-accounts')({
    component: PaymentAccountSettings,
})
