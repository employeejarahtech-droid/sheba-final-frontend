import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/operation-types/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Operation Types</div>
}
