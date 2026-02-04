import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/payroll/employees/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/payroll/employees/"!</div>
}
