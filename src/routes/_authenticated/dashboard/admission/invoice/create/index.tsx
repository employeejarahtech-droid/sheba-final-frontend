import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/dashboard/admission/invoice/create/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Create Invoice</div>
}
