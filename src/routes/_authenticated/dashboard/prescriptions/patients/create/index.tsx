import { createFileRoute } from '@tanstack/react-router'
import { PatientForm } from '@/features/prescriptions/components/PatientForm'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/patients/create/')({
  component: () => <PatientForm />,
})
