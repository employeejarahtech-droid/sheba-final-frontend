import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/treatment-outcomes/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Treatment Outcomes</div>
}
