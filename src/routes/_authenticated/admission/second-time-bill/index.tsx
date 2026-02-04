import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admission/second-time-bill/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Second Time Bill</div>
}
