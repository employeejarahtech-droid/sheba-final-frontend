import { createFileRoute } from '@tanstack/react-router'
import TreatmentOutcomes from '@/features/treatment-outcomes'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/treatment-outcomes/',
)({
  component: () => <TreatmentOutcomes />,
})
