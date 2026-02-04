import Invoices from '@/features/invoices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/reception/invoices/list/')({
  component: Invoices,
})