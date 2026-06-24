import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/balance-sheet/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/accounting/reports/balance-sheet' })
  },
  component: () => null,
})
