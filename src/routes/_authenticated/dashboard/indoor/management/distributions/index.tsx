import { createFileRoute } from '@tanstack/react-router'
import { BillDistributionsPage } from '@/features/indoor/bill-distributions'

export const Route = createFileRoute(
  '/_authenticated/dashboard/indoor/management/distributions/',
)({
  component: BillDistributionsPage,
})
