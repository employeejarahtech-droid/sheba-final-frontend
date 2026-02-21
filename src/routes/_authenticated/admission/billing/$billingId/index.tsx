import { createFileRoute } from '@tanstack/react-router'
import { BillingViewPage } from '@/features/admission/BillingViewPage'

export const Route = createFileRoute('/_authenticated/admission/billing/$billingId/')({
    component: BillingViewPage,
})
