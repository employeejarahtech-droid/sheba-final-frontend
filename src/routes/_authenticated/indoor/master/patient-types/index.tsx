import { createFileRoute } from '@tanstack/react-router'
import PatientTypes from '@/features/patient-types'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/patient-types/',
)({
  component: () => <PatientTypes />,
})
