import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/dashboard/admission/finalise-services/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Finalise Services</div>
}
