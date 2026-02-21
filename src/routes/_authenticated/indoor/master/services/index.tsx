import { createFileRoute } from '@tanstack/react-router'
import Services from '@/features/services'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/services/',
)({
  component: () => <Services />,
})
