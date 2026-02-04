import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admission/bed-cabin-charge/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Bed Cabin Charge</div>
}
