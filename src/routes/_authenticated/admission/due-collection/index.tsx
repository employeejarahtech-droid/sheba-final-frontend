import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admission/due-collection/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Due Collection</div>
}
