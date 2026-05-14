import { createFileRoute } from '@tanstack/react-router'
import { DoctorReferredPage } from '@/features/indoor/doctor-referred'

export const Route = createFileRoute(
  '/_authenticated/indoor/management/doctor-referred/',
)({
  component: DoctorReferredPage,
})
