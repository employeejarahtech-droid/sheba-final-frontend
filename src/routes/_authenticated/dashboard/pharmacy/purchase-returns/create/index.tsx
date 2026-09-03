import { createFileRoute } from '@tanstack/react-router'
import { PurchaseReturnForm } from '@/features/pharmacy/components/PurchaseReturnForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/purchase-returns/create/')({
  component: () => <PurchaseReturnForm />,
})
