import { createFileRoute } from '@tanstack/react-router'
import { BillingViewPage } from '@/features/admission/BillingViewPage'

export const Route = createFileRoute('/_authenticated/dashboard/admission/billing/$billingId/')({
    component: BillingViewPage,
})
