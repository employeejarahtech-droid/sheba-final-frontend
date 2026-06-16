import { createFileRoute } from '@tanstack/react-router'
import { MyAccountPage } from '@/features/my-account'

export const Route = createFileRoute('/_authenticated/dashboard/my-account/')({
  component: MyAccountPage,
})
