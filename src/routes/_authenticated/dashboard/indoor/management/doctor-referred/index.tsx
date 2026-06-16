import { createFileRoute } from '@tanstack/react-router'
import { DoctorReferredPage } from '@/features/indoor/doctor-referred'

export const Route = createFileRoute(
  '/_authenticated/dashboard/indoor/management/doctor-referred/',
)({
  component: DoctorReferredPage,
})
