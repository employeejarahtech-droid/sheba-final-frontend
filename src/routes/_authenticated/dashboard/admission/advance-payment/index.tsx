import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/dashboard/admission/advance-payment/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Advance Payment</div>
}
