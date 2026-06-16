import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/dashboard/admission/due-collection/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Due Collection</div>
}
