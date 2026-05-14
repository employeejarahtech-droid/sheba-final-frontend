import UserInvoices from '@/features/user-invoices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/reception/user-invoices/')({
  component: UserInvoices,
})
