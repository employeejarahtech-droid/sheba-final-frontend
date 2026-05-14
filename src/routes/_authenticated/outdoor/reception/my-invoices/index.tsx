import MyInvoices from '@/features/my-invoices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/reception/my-invoices/')({
  component: MyInvoices,
})
