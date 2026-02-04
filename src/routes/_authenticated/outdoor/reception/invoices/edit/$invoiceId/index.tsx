import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/outdoor/reception/invoices/edit/$invoiceId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/_authenticated/outdoor/reception/invoices/edit/$invoiceId/"!
    </div>
  )
}
