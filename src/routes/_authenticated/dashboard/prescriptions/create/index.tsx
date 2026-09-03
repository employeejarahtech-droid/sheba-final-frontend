import { createFileRoute } from '@tanstack/react-router'
import { PrescriptionForm } from '@/features/prescriptions/components/PrescriptionForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/create/')({
  component: () => <PrescriptionForm />,
})
