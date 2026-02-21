import { createFileRoute } from '@tanstack/react-router'
import OperationTypes from '@/features/operation-types'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/operation-types/',
)({
  component: () => <OperationTypes />,
})
