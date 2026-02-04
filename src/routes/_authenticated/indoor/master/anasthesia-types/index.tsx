import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/anasthesia-types/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Anasthesia Types</div>
}
