import { createFileRoute } from '@tanstack/react-router'
import DoctorTypes from '@/features/doctor-types'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/doctor-types/',
)({
  component: () => <DoctorTypes />,
})
