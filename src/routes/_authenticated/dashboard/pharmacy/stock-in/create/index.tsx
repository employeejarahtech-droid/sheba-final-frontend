import { createFileRoute } from '@tanstack/react-router'
import { StockInForm } from '@/features/pharmacy/components/StockInForm'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-in/create/')({
  component: () => <StockInForm />,
})
