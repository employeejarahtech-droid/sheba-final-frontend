import { createFileRoute } from '@tanstack/react-router'
import { SaleForm } from '@/features/pharmacy/components/SaleForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales/create/')({
  component: () => <SaleForm />,
})
