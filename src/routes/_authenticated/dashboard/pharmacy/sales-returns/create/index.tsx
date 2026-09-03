import { createFileRoute } from '@tanstack/react-router'
import { StandaloneSaleReturnForm } from '@/features/pharmacy/components/StandaloneSaleReturnForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales-returns/create/')({
  component: StandaloneSaleReturnForm,
})
