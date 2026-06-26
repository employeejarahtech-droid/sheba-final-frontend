import { createFileRoute } from '@tanstack/react-router'
import { GrnForm } from '@/features/purchase/components/GrnForm'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/goods-receipt/create/')({
  component: () => <GrnForm />,
})
