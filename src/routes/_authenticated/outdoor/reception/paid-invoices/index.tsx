import PaidInvoices from '@/features/paid-invoices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/reception/paid-invoices/')({
  component: PaidInvoices,
})
