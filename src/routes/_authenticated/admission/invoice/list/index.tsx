import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admission/invoice/list/')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return <div>List of Invoice</div>
}
