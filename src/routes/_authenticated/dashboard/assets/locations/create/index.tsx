import { createFileRoute } from '@tanstack/react-router'
import { LocationForm } from '@/features/assets/components/LocationForm'

export const Route = createFileRoute('/_authenticated/dashboard/assets/locations/create/')({
  component: () => <LocationForm />,
})
