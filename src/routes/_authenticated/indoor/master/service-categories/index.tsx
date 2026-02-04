import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/service-categories/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Service Categories</div>
}
