import { createFileRoute } from '@tanstack/react-router'
import AnasthesiaTypes from '@/features/anasthesia-types'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/anasthesia-types/',
)({
  component: () => <AnasthesiaTypes />,
})
