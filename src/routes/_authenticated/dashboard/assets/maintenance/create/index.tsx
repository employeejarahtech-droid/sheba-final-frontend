import { createFileRoute } from '@tanstack/react-router'
import { MaintenanceForm } from '@/features/assets/components/MaintenanceForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/maintenance/create/')({
  component: () => <MaintenanceForm />,
})
