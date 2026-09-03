import { createFileRoute } from '@tanstack/react-router'
import { SaleReturnForm } from '@/features/pharmacy/components/SaleReturnForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales/$id/return/')({
  component: SaleReturnPage,
})

function SaleReturnPage() {
  const { id } = Route.useParams()
  return <SaleReturnForm saleId={id} />
}
