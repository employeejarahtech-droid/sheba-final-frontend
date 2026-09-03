import { createFileRoute } from '@tanstack/react-router'
import { SaleForm } from '@/features/pharmacy/components/SaleForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales/$id/edit/')({
  component: SaleEditPage,
})

function SaleEditPage() {
  const { id } = Route.useParams()
  return <SaleForm saleId={id} />
}
