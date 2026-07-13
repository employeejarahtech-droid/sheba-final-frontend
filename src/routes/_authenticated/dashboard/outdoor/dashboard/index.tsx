import { createFileRoute } from '@tanstack/react-router'
import { OutdoorDashboardPage } from '@/features/outdoor/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/dashboard/')({
  component: OutdoorDashboardPage,
})
