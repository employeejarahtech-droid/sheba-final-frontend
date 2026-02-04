import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admission/finalise-services/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Finalise Services</div>
}
