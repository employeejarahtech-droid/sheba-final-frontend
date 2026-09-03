import { createFileRoute } from '@tanstack/react-router'
import { StockAdjustmentForm } from '@/features/pharmacy/components/StockAdjustmentForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-adjustments/create/')({
  component: () => <StockAdjustmentForm />,
})
