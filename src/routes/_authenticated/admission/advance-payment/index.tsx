import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admission/advance-payment/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Advance Payment</div>
}
