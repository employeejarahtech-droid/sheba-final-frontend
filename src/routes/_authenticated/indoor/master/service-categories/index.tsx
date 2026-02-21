import { createFileRoute } from '@tanstack/react-router'
import ServiceCategories from '@/features/service-categories'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/service-categories/',
)({
  component: () => <ServiceCategories />,
})
