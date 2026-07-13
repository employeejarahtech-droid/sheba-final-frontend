import { createFileRoute } from '@tanstack/react-router'
import { PathologyDashboardPage } from '@/features/pathology/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/pathology/dashboard/')({
  component: PathologyDashboardPage,
})
